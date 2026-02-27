import { useState, useEffect, useCallback } from 'react'
import { Box, Flex, Text, Spinner, Button } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { MapPin, Zap, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { DashboardLayout } from "../../components/layout/DashboardLayout"
import { StatCard } from "../../components/dashboard/StatCard"
import { AlertCard } from "../../components/dashboard/AlertCard"
import { FieldCard } from "../../components/dashboard/FieldCard"
import { AddNewFieldCard } from "../../components/dashboard/AddNewFieldCard"
import { AddFieldWizard } from "./AddFieldWizard"
import { fieldsService } from "../../features/fields/fields.service"
import type { Field } from "../../features/fields/types"

export const Dashboard = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [fields, setFields] = useState<Field[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)

  const fetchFields = useCallback(async () => {
    try {
      const data = await fieldsService.getUserFields()
      setFields(data)
    } catch (error) {
      console.error("Error fetching fields:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  const handleAddNewField = () => setIsWizardOpen(true)

  const handleWizardSuccess = () => {
    fetchFields()
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

  const onlineFieldsCount = fields.filter(f => f.status === 'online').length

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
        <Flex direction="column" gap={8} w="full">
          {/* STATS ROW */}
          <Box display={{ base: "grid", md: "grid" }} gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
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
            <AlertCard
              title={t('dashboard.system_alert')}
              message="Antalya Serası'nda nem oranı düşük. Sulama öneriliyor."
              ctaText={t('dashboard.view_details')}
              onAction={() => console.log('Uyarı detay...')}
            />
          </Box>

          {/* FIELDS LIST */}
          <Box>
            <Flex align="center" justify="space-between" mb={6}>
              <Text fontSize="lg" fontWeight="bold" color="neutral.dark">
                {t('dashboard.registered_fields')}
              </Text>
            </Flex>

            <Box display="grid" gridTemplateColumns={{ base: "1fr", xl: "repeat(2, 1fr)" }} gap={6}>
              {fields.map(field => (
                <FieldCard
                  key={field.id}
                  field={field}
                  onDetailsClick={handleViewFieldDetails}
                />
              ))}
              <AddNewFieldCard onAddClick={handleAddNewField} />
            </Box>
          </Box>
        </Flex>
      </DashboardLayout>
    </>
  )
}
