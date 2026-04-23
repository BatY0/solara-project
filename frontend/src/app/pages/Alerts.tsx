import { useState, useEffect, useCallback } from 'react';
import {
    Box, Flex, Text, Button, Badge, IconButton, Input, useDisclosure, chakra, Spinner
} from '@chakra-ui/react';
import { Plus, Trash2, Edit, BellRing, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { alertsService } from '../../features/alerts/alerts.service';
import type { AlertRule, AlertEvent, CreateAlertRuleRequest } from '../../features/alerts/types';
import { AlertMetric, AlertOperator } from '../../features/alerts/types';
import { fieldsService } from '../../features/fields/fields.service';
import type { Field } from '../../features/fields/types';
import { parseBackendDate } from '../../utils/dateTime';

export const Alerts = () => {
    const { t } = useTranslation();
    const [rules, setRules] = useState<AlertRule[]>([]);
    const [events, setEvents] = useState<AlertEvent[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filter states
    const [rulesSearchTerm, setRulesSearchTerm] = useState('');
    const [rulesStatusFilter, setRulesStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [historySearchTerm, setHistorySearchTerm] = useState('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'active' | 'resolved'>('all');

    // UI state
    const [activeTab, setActiveTab] = useState<'rules' | 'history'>('rules');
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const { open, onOpen, onClose } = useDisclosure();

    // Modal state
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [formData, setFormData] = useState<CreateAlertRuleRequest>({
        fieldId: '',
        name: '',
        metric: AlertMetric.SOIL_HUMIDITY,
        operator: AlertOperator.BELOW,
        threshold: 0,
        durationMinutes: 15,
        notifyEmail: true,
        active: true
    });

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [rulesData, eventsData, fieldsData] = await Promise.all([
                alertsService.getRules(selectedFieldId || undefined),
                alertsService.getEventHistory(selectedFieldId || undefined),
                fieldsService.getUserFields()
            ]);
            setRules(rulesData);
            setEvents(eventsData);
            setFields(fieldsData);
        } catch (error) {
            console.error("Failed to fetch alerts data", error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFieldId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (rule?: AlertRule) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                fieldId: rule.fieldId,
                name: rule.name,
                metric: rule.metric,
                operator: rule.operator,
                threshold: rule.threshold,
                durationMinutes: rule.durationMinutes,
                notifyEmail: rule.notifyEmail,
                active: rule.active
            });
        } else {
            setEditingRule(null);
            setFormData({
                fieldId: fields.length > 0 ? fields[0].id : '',
                name: '',
                metric: AlertMetric.SOIL_HUMIDITY,
                operator: AlertOperator.BELOW,
                threshold: 0,
                durationMinutes: 15,
                notifyEmail: true,
                active: true
            });
        }
        onOpen();
    };

    const handleSaveRule = async () => {
        try {
            if (editingRule) {
                await alertsService.updateRule(editingRule.id, formData);
            } else {
                await alertsService.createRule(formData);
            }
            onClose();
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteRule = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this rule?")) {
            try {
                await alertsService.deleteRule(id);
                fetchData();
            } catch (error) {
                console.error(error);
            }
        }
    };

    const toggleRuleActive = async (rule: AlertRule) => {
        try {
            await alertsService.updateRule(rule.id, {
                ...rule,
                active: !rule.active
            });
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const formatMetric = (metric: string) => {
        return t(`alerts.metrics.${metric}`, metric);
    };

    const getOperatorSymbol = (op: string) => op === 'ABOVE' ? '>' : '<';

    const filteredRules = rules.filter(rule => {
        const q = rulesSearchTerm.toLowerCase();
        const matchesSearch =
            rule.name.toLowerCase().includes(q) ||
            rule.fieldName.toLowerCase().includes(q) ||
            formatMetric(rule.metric).toLowerCase().includes(q);

        const matchesStatus =
            rulesStatusFilter === 'all' ||
            (rulesStatusFilter === 'active' && rule.active) ||
            (rulesStatusFilter === 'inactive' && !rule.active);

        return matchesSearch && matchesStatus;
    });

    const filteredEvents = events.filter(event => {
        const matchesSearch =
            event.ruleName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
            event.fieldName.toLowerCase().includes(historySearchTerm.toLowerCase());

        const matchesStatus =
            historyStatusFilter === 'all' ||
            (historyStatusFilter === 'active' && event.active) ||
            (historyStatusFilter === 'resolved' && !event.active);

        return matchesSearch && matchesStatus;
    });



    if (isLoading && rules.length === 0) {
        return (
            <DashboardLayout title={t('alerts.title')} subtitle={t('alerts.subtitle')}>
                <Flex justify="center" align="center" h="50vh">
                    <Spinner size="xl" color="brand.500" />
                </Flex>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title={t('alerts.title')} subtitle={t('alerts.subtitle')}>
            <Flex direction="column" gap={6} w="full">

                {/* Header Actions */}
                <Flex justify="space-between" align={{ base: "stretch", md: "center" }} direction={{ base: "column", md: "row" }} gap={{ base: 3, md: 0 }}>
                    <Flex gap={2} wrap="wrap">
                        <Button
                            variant={activeTab === 'rules' ? 'solid' : 'ghost'}
                            colorScheme={activeTab === 'rules' ? 'green' : 'gray'}
                            onClick={() => setActiveTab('rules')}
                            size="sm"
                            gap={2}
                        >
                            <BellRing size={16} />
                            {t('alerts.tab_rules')}
                        </Button>
                        <Button
                            variant={activeTab === 'history' ? 'solid' : 'ghost'}
                            colorScheme={activeTab === 'history' ? 'blue' : 'gray'}
                            onClick={() => setActiveTab('history')}
                            size="sm"
                            gap={2}
                        >
                            <Clock size={16} />
                            {t('alerts.tab_history')}
                        </Button>
                    </Flex>

                    {/* RIGHT CONTROLS */}
                    <Flex gap={3} align="center" direction={{ base: "column", sm: "row" }} w={{ base: "full", md: "auto" }}>
                        <Box w={{ base: "full", sm: "250px" }}>
                            <chakra.select
                                w="full"
                                h="36px"
                                pl={3}
                                pr={8}
                                borderRadius="md"
                                border="1px solid"
                                borderColor="gray.200"
                                bg="white"
                                fontSize="sm"
                                value={selectedFieldId}
                                onChange={(e) => setSelectedFieldId(e.target.value)}
                            >
                                <option value="">{t('alerts.all_fields')}</option>
                                {fields.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </chakra.select>
                        </Box>
                        {activeTab === 'rules' && (
                            <Button
                                size="sm"
                                bg="green.500"
                                color="white"
                                _hover={{ bg: "green.600" }}
                                onClick={() => handleOpenModal()}
                                w={{ base: "full", sm: "auto" }}
                            >
                                <Plus size={16} /> {t('alerts.add_rule')}
                            </Button>
                        )}
                    </Flex>
                </Flex>

                <Box bg="white" borderRadius="xl" shadow="sm" overflow="hidden">
                    {/* RULES TAB CONTENT */}
                    {activeTab === 'rules' && (
                        <Box p={4}>
                            <Flex gap={4} mb={4} direction={{ base: "column", md: "row" }} align="center">
                                <Box flex={1} w="full">
                                    <Input
                                        placeholder={t('alerts.search_placeholder')}
                                        value={rulesSearchTerm}
                                        onChange={(e) => setRulesSearchTerm(e.target.value)}
                                        bg="white"
                                        borderRadius="xl"
                                    />
                                </Box>
                                <Box w={{ base: "full", md: "200px" }}>
                                    <chakra.select
                                        w="full"
                                        h="40px"
                                        px={3}
                                        value={rulesStatusFilter}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRulesStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                                        bg="white"
                                        border="1px solid"
                                        borderColor="neutral.border"
                                        borderRadius="xl"
                                        fontSize="sm"
                                    >
                                        <option value="all">{t('alerts.filter_all')}</option>
                                        <option value="active">{t('alerts.filter_active')}</option>
                                        <option value="inactive">{t('alerts.filter_inactive')}</option>
                                    </chakra.select>
                                </Box>
                            </Flex>

                            {filteredRules.length === 0 ? (
                                <Text color="gray.500" textAlign="center" py={10}>{t('alerts.no_rules')}</Text>
                            ) : (
                                <>
                                <Flex display={{ base: "flex", md: "none" }} direction="column" gap={3}>
                                    {filteredRules.map(rule => (
                                        <Box key={rule.id} borderWidth="1px" borderColor="gray.100" borderRadius="xl" p={4}>
                                            <Flex justify="space-between" align="start" gap={3} mb={3}>
                                                <Box>
                                                    <Text fontWeight="bold">{rule.name}</Text>
                                                    <Text fontSize="sm" color="gray.500">{rule.fieldName}</Text>
                                                </Box>
                                                <Badge colorPalette={rule.active ? "green" : "gray"}>
                                                    {rule.active ? t('alerts.filter_active') : t('alerts.filter_inactive')}
                                                </Badge>
                                            </Flex>

                                            <Flex direction="column" gap={1} mb={3}>
                                                <Text fontSize="sm" color="gray.600">
                                                    {t('alerts.col_condition')}: {formatMetric(rule.metric)} {getOperatorSymbol(rule.operator)} {rule.threshold}
                                                </Text>
                                                <Text fontSize="sm" color="gray.600">
                                                    {t('alerts.col_duration')}: {rule.durationMinutes} min
                                                </Text>
                                            </Flex>

                                            <Flex justify="space-between" align="center">
                                                <Box
                                                    w="44px" h="24px"
                                                    bg={rule.active ? "green.500" : "gray.300"}
                                                    borderRadius="full"
                                                    position="relative"
                                                    cursor="pointer"
                                                    transition="background-color 0.2s"
                                                    onClick={() => toggleRuleActive(rule)}
                                                >
                                                    <Box
                                                        w="20px" h="20px" bg="white" borderRadius="full"
                                                        position="absolute" top="2px" shadow="sm"
                                                        left={rule.active ? "22px" : "2px"}
                                                        transition="left 0.2s"
                                                    />
                                                </Box>

                                                <Flex align="center" gap={2}>
                                                    <IconButton
                                                        aria-label={t('alerts.edit_rule_title')}
                                                        title={t('alerts.edit_rule_title')}
                                                        color="gray.500"
                                                        bg="transparent"
                                                        _hover={{ bg: "gray.100" }}
                                                        size="sm"
                                                        onClick={() => handleOpenModal(rule)}
                                                    >
                                                        <Edit size={16} />
                                                    </IconButton>
                                                    <IconButton
                                                        aria-label={t('alerts.delete_rule_title')}
                                                        title={t('alerts.delete_rule_title')}
                                                        color="red.500"
                                                        bg="transparent"
                                                        _hover={{ bg: "red.50" }}
                                                        size="sm"
                                                        onClick={() => handleDeleteRule(rule.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </IconButton>
                                                </Flex>
                                            </Flex>
                                        </Box>
                                    ))}
                                </Flex>

                                <Box display={{ base: "none", md: "block" }} overflowX="auto">
                                    <Box as="table" w="full" style={{ borderCollapse: 'collapse' }}>
                                        <Box as="thead" bg="gray.50">
                                            <Box as="tr">
                                                <Box as="th" p={4} textAlign="left" fontWeight="bold" color="gray.600">{t('alerts.col_name')}</Box>
                                                <Box as="th" p={4} textAlign="left" fontWeight="bold" color="gray.600">{t('alerts.col_condition')}</Box>
                                                <Box as="th" p={4} textAlign="left" fontWeight="bold" color="gray.600">{t('alerts.col_duration')}</Box>
                                                <Box as="th" p={4} textAlign="left" fontWeight="bold" color="gray.600">{t('alerts.col_status')}</Box>
                                                <Box as="th" p={4} textAlign="right" fontWeight="bold" color="gray.600">{t('alerts.col_actions')}</Box>
                                            </Box>
                                        </Box>
                                        <Box as="tbody">
                                            {filteredRules.map(rule => (
                                                <Box as="tr" key={rule.id} borderBottom="1px solid" borderColor="gray.100">
                                                    <Box as="td" p={4}>
                                                        <Text fontWeight="bold">{rule.name}</Text>
                                                        <Text fontSize="sm" color="gray.500">{rule.fieldName}</Text>
                                                    </Box>
                                                    <Box as="td" p={4}>
                                                        <Text>
                                                            {formatMetric(rule.metric)} {getOperatorSymbol(rule.operator)} {rule.threshold}
                                                        </Text>
                                                    </Box>
                                                    <Box as="td" p={4}>
                                                        <Text color="gray.600" fontSize="sm">{rule.durationMinutes} min</Text>
                                                    </Box>
                                                    <Box as="td" p={4}>
                                                        <Box
                                                            w="44px" h="24px"
                                                            bg={rule.active ? "green.500" : "gray.300"}
                                                            borderRadius="full"
                                                            position="relative"
                                                            cursor="pointer"
                                                            transition="background-color 0.2s"
                                                            onClick={() => toggleRuleActive(rule)}
                                                        >
                                                            <Box
                                                                w="20px" h="20px" bg="white" borderRadius="full"
                                                                position="absolute" top="2px" shadow="sm"
                                                                left={rule.active ? "22px" : "2px"}
                                                                transition="left 0.2s"
                                                            />
                                                        </Box>
                                                    </Box>
                                                    <Box as="td" p={4} textAlign="right">
                                                        <IconButton
                                                            aria-label={t('alerts.edit_rule_title')}
                                                            title={t('alerts.edit_rule_title')}
                                                            color="gray.500"
                                                            bg="transparent"
                                                            _hover={{ bg: "gray.100" }}
                                                            size="sm"
                                                            mr={2}
                                                            onClick={() => handleOpenModal(rule)}
                                                        >
                                                            <Edit size={16} />
                                                        </IconButton>
                                                        <IconButton
                                                            aria-label={t('alerts.delete_rule_title')}
                                                            title={t('alerts.delete_rule_title')}
                                                            color="red.500"
                                                            bg="transparent"
                                                            _hover={{ bg: "red.50" }}
                                                            size="sm"
                                                            onClick={() => handleDeleteRule(rule.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                                </>
                            )}
                        </Box>
                    )}

                    {/* HISTORY TAB CONTENT */}
                    {activeTab === 'history' && (
                        <Box p={4}>
                            <Flex justify="space-between" align={{ base: "start", md: "center" }} mb={4} direction={{ base: "column", md: "row" }} gap={3}>
                                <Text color="gray.600" fontSize="sm">
                                    {t('alerts.history_desc')}
                                </Text>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={async () => {
                                        await alertsService.markAllAsRead();
                                        window.dispatchEvent(new Event('notificationsRead'));
                                        fetchData();
                                    }}
                                    w={{ base: "full", md: "auto" }}
                                >
                                    {t('alerts.mark_all_read')}
                                </Button>
                            </Flex>

                            {/* Filter Bar */}
                            <Flex gap={4} mb={6} direction={{ base: "column", md: "row" }} align="center">
                                <Box flex={1} w="full">
                                    <Input
                                        placeholder={t('alerts.search_placeholder')}
                                        value={historySearchTerm}
                                        onChange={(e) => setHistorySearchTerm(e.target.value)}
                                        bg="white"
                                        borderRadius="xl"
                                    />
                                </Box>
                                <Box w={{ base: "full", md: "200px" }}>
                                    <chakra.select
                                        w="full"
                                        h="40px"
                                        px={3}
                                        value={historyStatusFilter}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setHistoryStatusFilter(e.target.value as any)}
                                        bg="white"
                                        border="1px solid"
                                        borderColor="neutral.border"
                                        borderRadius="xl"
                                        fontSize="sm"
                                    >
                                        <option value="all">{t('alerts.filter_all')}</option>
                                        <option value="active">{t('alerts.filter_active')}</option>
                                        <option value="resolved">{t('alerts.filter_resolved')}</option>
                                    </chakra.select>
                                </Box>
                            </Flex>

                            {filteredEvents.length === 0 ? (
                                <Text color="gray.500" textAlign="center" py={10}>{t('alerts.no_events')}</Text>
                            ) : (
                                <>
                                <Flex display={{ base: "flex", md: "none" }} direction="column" gap={3}>
                                    {filteredEvents.map(event => {
                                        const triggered = parseBackendDate(event.triggeredAt);
                                        return (
                                            <Box key={event.id} borderWidth="1px" borderColor="gray.100" borderRadius="xl" p={4} bg={event.active ? "red.50" : "white"}>
                                                <Flex justify="space-between" align="start" gap={3} mb={2}>
                                                    <Box>
                                                        <Text fontWeight="bold">{event.ruleName}</Text>
                                                        <Text fontSize="sm" color="gray.600">{event.fieldName}</Text>
                                                    </Box>
                                                    <Badge bg={event.active ? "red.100" : "green.100"} color={event.active ? "red.700" : "green.700"}>
                                                        {event.active ? t('alerts.active_breach') : t('alerts.filter_resolved')}
                                                    </Badge>
                                                </Flex>
                                                <Text fontSize="sm" color="gray.500" mb={1}>{triggered.toLocaleString()}</Text>
                                                <Text fontSize="sm" color="gray.700">
                                                    {t('alerts.condition_text', {
                                                        metric: formatMetric(event.metric),
                                                        value: event.lastValue,
                                                        threshold: event.threshold
                                                    })}
                                                </Text>
                                            </Box>
                                        );
                                    })}
                                </Flex>

                                <Box display={{ base: "none", md: "block" }} overflowX="auto">
                                    <Box as="table" w="full" style={{ borderCollapse: 'collapse' }}>
                                        <Box as="thead" bg="gray.50">
                                            <Box as="tr">
                                                <Box as="th" p={4} textAlign="left" color="gray.600" fontWeight="bold">{t('alerts.col_time')}</Box>
                                                <Box as="th" p={4} textAlign="left" color="gray.600" fontWeight="bold">{t('alerts.col_field')}</Box>
                                                <Box as="th" p={4} textAlign="left" color="gray.600" fontWeight="bold">{t('alerts.col_rule')}</Box>
                                                <Box as="th" p={4} textAlign="left" color="gray.600" fontWeight="bold">{t('alerts.col_condition_val')}</Box>
                                                <Box as="th" p={4} textAlign="left" color="gray.600" fontWeight="bold">{t('alerts.col_status')}</Box>
                                            </Box>
                                        </Box>
                                        <Box as="tbody">
                                            {filteredEvents.map(event => {
                                                    const triggered = parseBackendDate(event.triggeredAt);
                                                    return (
                                                        <Box as="tr" key={event.id} bg={event.active ? "red.50" : "transparent"} borderBottom="1px solid" borderColor="gray.100">
                                                            <Box as="td" p={4}>{triggered.toLocaleString()}</Box>
                                                            <Box as="td" p={4} fontWeight="medium">{event.fieldName}</Box>
                                                            <Box as="td" p={4}>{event.ruleName}</Box>
                                                            <Box as="td" p={4}>
                                                                {t('alerts.condition_text', {
                                                                    metric: formatMetric(event.metric),
                                                                    value: event.lastValue,
                                                                    threshold: event.threshold
                                                                })}
                                                            </Box>
                                                            <Box as="td" p={4}>
                                                                <Badge bg={event.active ? "red.100" : "green.100"} color={event.active ? "red.700" : "green.700"}>
                                                                    {event.active ? t('alerts.active_breach') : `${t('alerts.resolved_at')} ${event.resolvedAt ? parseBackendDate(event.resolvedAt).toLocaleTimeString() : ''}`}
                                                                </Badge>
                                                            </Box>
                                                        </Box>
                                                    )
                                                })}
                                        </Box>
                                    </Box>
                                </Box>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </Flex>

            {/* RULE MODAL */}
            {open && (
                <>
                    <Box position="fixed" inset={0} bg="blackAlpha.600" zIndex={50} onClick={onClose} />
                    <Flex position="fixed" inset={0} zIndex={60} align={{ base: "flex-start", md: "center" }} justify="center" p={{ base: 3, md: 4 }} overflowY="auto">
                        <Flex bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="xl" direction="column" w="full" maxW="md" mx={0} mt={{ base: 3, md: 0 }} position="relative" maxH={{ base: "calc(100dvh - 1.5rem)", md: "90vh" }} overflow="hidden">
                            <Flex justify="space-between" align="center" mb={4}>
                                <Text fontSize="xl" fontWeight="bold">
                                    {editingRule ? t('alerts.edit_rule_title') : t('alerts.create_rule_title')}
                                </Text>
                                <IconButton
                                    aria-label={t('alerts.cancel')}
                                    title={t('alerts.cancel')}
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                >
                                    <X size={18} />
                                </IconButton>
                            </Flex>

                            <Box flex={1} overflowY="auto" pr={{ base: 0, md: 1 }}>
                                <Flex direction="column" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={1}>{t('alerts.rule_name')}</Text>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder={t('alerts.rule_name_placeholder')}
                                        />
                                    </Box>

                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={1}>{t('alerts.select_field')}</Text>
                                        <chakra.select
                                            value={formData.fieldId}
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, fieldId: e.target.value })}
                                            border="1px solid" borderColor="gray.200" borderRadius="md" p={2} w="full" bg="white"
                                        >
                                            {fields.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </chakra.select>
                                    </Box>

                                    <Flex gap={4} direction={{ base: "column", md: "row" }}>
                                        <Box flex={1}>
                                            <Text fontSize="sm" fontWeight="bold" mb={1}>{t('alerts.metric')}</Text>
                                            <chakra.select
                                                value={formData.metric}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, metric: e.target.value as AlertMetric })}
                                                border="1px solid" borderColor="gray.200" borderRadius="md" p={2} w="full" bg="white"
                                            >
                                                <option value={AlertMetric.SOIL_HUMIDITY}>{t('alerts.metrics.SOIL_HUMIDITY')}</option>
                                                <option value={AlertMetric.SOIL_TEMP}>{t('alerts.metrics.SOIL_TEMP')}</option>
                                                <option value={AlertMetric.AMBIENT_TEMP}>{t('alerts.metrics.AMBIENT_TEMP')}</option>
                                                <option value={AlertMetric.AMBIENT_HUMIDITY}>{t('alerts.metrics.AMBIENT_HUMIDITY')}</option>
                                                <option value="BATTERY_PERCENTAGE">{t('alerts.metrics.BATTERY_PERCENTAGE')}</option>
                                            </chakra.select>
                                        </Box>
                                        <Box flex={1}>
                                            <Text fontSize="sm" fontWeight="bold" mb={1}>{t('alerts.operator')}</Text>
                                            <chakra.select
                                                value={formData.operator}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, operator: e.target.value as AlertOperator })}
                                                border="1px solid" borderColor="gray.200" borderRadius="md" p={2} w="full" bg="white"
                                            >
                                                <option value={AlertOperator.BELOW}>{t('alerts.operator_below')}</option>
                                                <option value={AlertOperator.ABOVE}>{t('alerts.operator_above')}</option>
                                            </chakra.select>
                                        </Box>
                                    </Flex>

                                    <Flex gap={4} direction={{ base: "column", md: "row" }}>
                                        <Box flex={1}>
                                            <Text fontSize="sm" fontWeight="bold" mb={1}>{t('alerts.threshold')}</Text>
                                            <Input
                                                type="number"
                                                value={formData.threshold}
                                                onChange={(e) => setFormData(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                                            />
                                        </Box>
                                        <Box flex={1}>
                                            <Text fontSize="sm" fontWeight="bold" mb={1}>{t('alerts.duration_min')}</Text>
                                            <chakra.select
                                                value={formData.durationMinutes}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                                                border="1px solid" borderColor="gray.200" borderRadius="md" p={2} w="full" bg="white"
                                            >
                                                <option value={1}>{t('alerts.duration_1m')}</option>
                                                <option value={15}>{t('alerts.duration_15m')}</option>
                                                <option value={30}>{t('alerts.duration_30m')}</option>
                                                <option value={60}>{t('alerts.duration_60m')}</option>
                                            </chakra.select>
                                        </Box>
                                    </Flex>

                                    <Box mt={2}>
                                        <Box
                                            role="button"
                                            tabIndex={0}
                                            px={1}
                                            py={1}
                                            borderRadius="md"
                                            cursor="pointer"
                                            _hover={{ bg: "gray.50" }}
                                            onClick={() => setFormData({ ...formData, notifyEmail: !formData.notifyEmail })}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    setFormData({ ...formData, notifyEmail: !formData.notifyEmail });
                                                }
                                            }}
                                        >
                                        <Flex align="center" gap={3}>
                                            <Box
                                                w="38px"
                                                h="22px"
                                                bg={formData.notifyEmail ? "green.500" : "gray.300"}
                                                borderRadius="full"
                                                border="1px solid"
                                                borderColor={formData.notifyEmail ? "green.500" : "gray.300"}
                                                position="relative"
                                                transition="all 0.2s"
                                            >
                                                <Box
                                                    position="absolute"
                                                    top="2px"
                                                    left="2px"
                                                    w="16px"
                                                    h="16px"
                                                    bg="white"
                                                    borderRadius="full"
                                                    boxShadow="sm"
                                                    transform={formData.notifyEmail ? "translateX(16px)" : "translateX(0)"}
                                                    transition="transform 0.2s"
                                                />
                                            </Box>
                                            <Text fontSize="sm" fontWeight="semibold" color="gray.700" lineHeight="short">
                                                {t('alerts.send_email')}
                                            </Text>
                                        </Flex>
                                        </Box>
                                    </Box>
                                </Flex>
                            </Box>

                            <Flex justify="flex-end" gap={3} mt={4} pt={4} borderTop="1px solid" borderColor="gray.100">
                                <Button variant="ghost" onClick={onClose}>{t('alerts.cancel')}</Button>
                                <Button
                                    bg="green.500"
                                    color="white"
                                    _hover={{ bg: 'green.600' }}
                                    onClick={handleSaveRule}
                                >
                                    {t('alerts.save_rule')}
                                </Button>
                            </Flex>
                        </Flex>
                    </Flex>
                </>
            )}
        </DashboardLayout>
    );
};
