import { useState, useEffect, useCallback } from 'react'
import { Box, Flex, Text, Spinner, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { MapPin, Zap, Plus, CheckCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { StatCard } from "../../components/dashboard/StatCard"
import { AlertCard } from "../../components/dashboard/AlertCard"
import { FieldCard } from "../../components/dashboard/FieldCard"
import { AddNewFieldCard } from "../../components/dashboard/AddNewFieldCard"
import { AddFieldWizard } from "./AddFieldWizard"
import { fieldsService } from "../../features/fields/fields.service"
import { alertsService } from "../../features/alerts/alerts.service"
import type { Field } from "../../features/fields/types"
import type { AlertEvent } from "../../features/alerts/types"
import { getDeviceStatus } from "../../utils/deviceStatus"

export const Dashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [fields, setFields] = useState<Field[]>([])
  const [unreadAlerts, setUnreadAlerts] = useState<AlertEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      const [fieldsData, alertsData] = await Promise.all([
        fieldsService.getUserFields(),
        alertsService.getUnreadNotifications()
      ])
      
      // Sort: paired (online-capable) fields first
      const sorted = [...fieldsData].sort((a, b) => {
        const statusOrder = { online: 2, inactive: 1, offline: 0 }
        const aStatus = statusOrder[getDeviceStatus(a, t).status]
        const bStatus = statusOrder[getDeviceStatus(b, t).status]
        return bStatus - aStatus
      })
      setFields(sorted)
      setUnreadAlerts(alertsData)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const handleAddNewField = () => setIsWizardOpen(true)

  const handleWizardSuccess = () => {
    fetchDashboardData()
  }

  const handleViewFieldDetails = (id: string) => {
    navigate(`/fields/${id}`)
  }

  if (isLoading) {
    return (
      <DashboardLayout title={t('dashboard.title')} subtitle={t('dashboard.subtitle')}>
        <Flex minH="60vh" align="center" justify="center" direction="column" color="brand.500">
          <Spinner size="xl" mb={4} />
          <Text fontWeight="medium" color="neutral.subtext">{t('dashboard.loading')}</Text>
        </Flex>
      </DashboardLayout>
    )
  }

  const onlineFieldsCount = fields.filter(f => getDeviceStatus(f, t).status === 'online').length;
  
  // Decide what to show in AlertCard
  const hasAlerts = unreadAlerts.length > 0;
  const latestAlert = hasAlerts ? unreadAlerts[0] : null;

  const alertTitle = hasAlerts 
    ? t(unreadAlerts.length > 1 ? 'alerts.dashboard_active_title_plural' : 'alerts.dashboard_active_title', { count: unreadAlerts.length })
    : t('alerts.dashboard_normal_title');

  let alertMessage = t('alerts.dashboard_normal_msg');
  if (hasAlerts && latestAlert) {
      const metricI18n = t(`alerts.metrics.${latestAlert.metric}`, latestAlert.metric);
      alertMessage = t('dashboard.active_alert_msg', {
          fieldName: latestAlert.fieldName,
          ruleName: latestAlert.ruleName,
          metric: metricI18n,
          value: latestAlert.lastValue
      });
  }

  const alertCta = hasAlerts ? t('dashboard.view_details') : t('alerts.dashboard_view_history');

  const handleDismissAlert = async () => {
    if (latestAlert) {
      try {
        await alertsService.markAsRead(latestAlert.id);
        window.dispatchEvent(new Event('notificationsRead'));
        fetchDashboardData();
      } catch (error) {
        console.error("Failed to dismiss alert", error);
      }
    }
  }

  return (
    <>
      <AddFieldWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleWizardSuccess}
      />
      <DashboardLayout
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
        actions={
          <Button
            display={{ base: 'none', md: 'flex' }}
            alignItems="center"
            gap={2}
            bg="brand.500"
            _hover={{ bg: 'brand.600' }}
            color="white"
            px={5}
            py={2.5}
            borderRadius="xl"
            fontSize="sm"
            fontWeight="bold"
            shadow="sm"
            onClick={handleAddNewField}
          >
            <Plus size={18} /> {t('dashboard.new_field')}
          </Button>
        }
      >
        <Flex direction="column" gap={{ base: 6, md: 6 }} w="full">
          {/* STATS ROW */}
          <Box display={{ base: "grid", md: "grid" }} gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={{ base: 4, md: 5 }}>
            <StatCard
              title={t('dashboard.total_fields')}
              value={fields.length}
              icon={MapPin}
              iconBgColor="brand.50"
              iconColor="brand.500"
            />
            <StatCard
              title={t('dashboard.active_sensors')}
              value={onlineFieldsCount}
              suffix={`/ ${fields.length}`}
              icon={Zap}
              iconBgColor="blue.50"
              iconColor="blue.500"
            />
            {hasAlerts ? (
                <AlertCard
                  title={alertTitle}
                  message={alertMessage}
                  ctaText={alertCta}
                  onAction={() => navigate('/alerts')}
                  onDismiss={handleDismissAlert}
                />
            ) : (
                <Flex
                    direction="column"
                    bg="white"
                    borderRadius="2xl"
                    p={6}
                    shadow="sm"
                    border="1px solid"
                    borderColor="neutral.border"
                    h="full"
                >
                    <Flex align="center" gap={3} mb={2}>
                        <Flex w={10} h={10} borderRadius="full" align="center" justify="center" bg="green.50" color="green.500">
                            <CheckCircle size={20} />
                        </Flex>
                        <Text fontSize="lg" fontWeight="bold" color="neutral.dark">
                            {alertTitle}
                        </Text>
                    </Flex>
                    <Text fontSize="sm" color="neutral.subtext" mb={4} flex={1}>
                        {alertMessage}
                    </Text>
                    <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="brand.500"
                        cursor="pointer"
                        _hover={{ color: "brand.600" }}
                        onClick={() => navigate('/alerts')}
                    >
                        {alertCta} →
                    </Text>
                </Flex>
            )}
          </Box>

          {/* FIELDS LIST */}
          <Box>
            <Flex
              align={{ base: "stretch", md: "center" }}
              justify="space-between"
              direction={{ base: "column", md: "row" }}
              gap={{ base: 3, md: 0 }}
              mb={{ base: 4, md: 5 }}
            >
              <Text fontSize="lg" fontWeight="bold" color="neutral.dark">
                {t('dashboard.registered_fields')}
              </Text>
              <Flex
                align={{ base: "stretch", sm: "center" }}
                direction={{ base: "column", sm: "row" }}
                gap={3}
                wrap="wrap"
                w={{ base: "full", md: "auto" }}
                justify={{ base: "flex-start", md: "flex-end" }}
              >
                {fields.length > 0 && (
                  <Text fontSize="sm" color="neutral.subtext" fontWeight="medium">
                    {fields.length} {t('dashboard.total_fields').toLowerCase()}
                  </Text>
                )}
                <Button
                  display={{ base: "inline-flex", md: "none" }}
                  alignItems="center"
                  justifyContent="center"
                  gap={2}
                  bg="brand.500"
                  _hover={{ bg: "brand.600" }}
                  color="white"
                  size="sm"
                  borderRadius="xl"
                  fontWeight="bold"
                  shadow="sm"
                  w={{ base: "full", sm: "auto" }}
                  onClick={handleAddNewField}
                >
                  <Plus size={16} /> {t('dashboard.new_field')}
                </Button>
                {fields.length > 4 && (
                  <Button variant="outline" size={{ base: "xs", md: "sm" }} onClick={() => navigate('/fields')}>
                    {t('dashboard.view_all_fields', { count: fields.length })}
                  </Button>
                )}
              </Flex>
            </Flex>

            <Box display="grid" gridTemplateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={{ base: 4, md: 5 }}>
              {fields.slice(0, 4).map(field => (
                <FieldCard
                  key={field.id}
                  field={field}
                  onDetailsClick={handleViewFieldDetails}
                />
              ))}
              {fields.length < 4 && <AddNewFieldCard onAddClick={handleAddNewField} />}
            </Box>
          </Box>
        </Flex>
      </DashboardLayout>
    </>
  )
}
