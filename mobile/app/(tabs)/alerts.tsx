import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Bell, Clock3, Plus, Trash2, Pencil, X, LogOut, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../src/theme/theme';
import { alertsService } from '../../src/services/alertsService';
import { fieldsService } from '../../src/services/fieldsService';
import { setBadgeCount } from '../../src/services/notificationsService';
import type { Field } from '../../src/types/fields';
import { AlertMetric, AlertOperator, type AlertEvent, type AlertRule, type CreateAlertRuleRequest } from '../../src/types/alerts';
import { useAuth } from '../../src/context/AuthContext';
import { parseBackendUtcDate } from '../../src/utils/parseBackendUtcDate';

type HistoryFilter = 'all' | 'active' | 'resolved';

const durationOptions = [1, 15, 30, 60];
const metricOptions = Object.values(AlertMetric);
const operatorOptions = Object.values(AlertOperator);

export default function AlertsScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const { logout } = useAuth();
    const params = useLocalSearchParams<{ tab?: string }>();

    const [rules, setRules] = useState<AlertRule[]>([]);
    const [events, setEvents] = useState<AlertEvent[]>([]);
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'rules' | 'history'>(params.tab === 'history' ? 'history' : 'rules');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<HistoryFilter>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showCustomDurationInput, setShowCustomDurationInput] = useState(false);
    const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
    const [formData, setFormData] = useState<CreateAlertRuleRequest>({
        fieldId: '',
        name: '',
        metric: AlertMetric.SOIL_HUMIDITY,
        operator: AlertOperator.BELOW,
        threshold: 0,
        durationMinutes: 15,
        notifyEmail: true,
        active: true,
    });

    const formatMetric = useCallback((metric: string) => t(`alerts.metrics.${metric}`, metric), [t]);
    const operatorSymbol = useCallback((operator: string) => (operator === AlertOperator.ABOVE ? '>' : '<'), []);
    const setDurationMinutes = useCallback((minutes: number) => {
        if (!Number.isFinite(minutes)) return;
        const normalized = Math.max(1, Math.floor(minutes));
        setFormData(prev => ({ ...prev, durationMinutes: normalized }));
    }, []);

    const fetchData = useCallback(async (refresh = false) => {
        if (!refresh) setIsLoading(true);
        try {
            const [rulesData, eventsData, fieldsData] = await Promise.all([
                alertsService.getRules(selectedFieldId || undefined),
                alertsService.getEventHistory(selectedFieldId || undefined),
                fieldsService.getUserFields(),
            ]);
            setRules(rulesData);
            setEvents(eventsData);
            setFields(fieldsData);
            if (!formData.fieldId && fieldsData.length > 0) {
                setFormData(prev => ({ ...prev, fieldId: fieldsData[0].id }));
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [formData.fieldId, selectedFieldId]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    useFocusEffect(
        useCallback(() => {
            void fetchData(true);
            const interval = setInterval(() => {
                void fetchData(true);
            }, 60000);
            return () => clearInterval(interval);
        }, [fetchData])
    );

    useEffect(() => {
        if (params.tab === 'history') {
            setActiveTab('history');
        } else if (params.tab === 'rules') {
            setActiveTab('rules');
        }
    }, [params.tab]);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const lowerSearch = searchTerm.trim().toLowerCase();
            const matchesSearch =
                lowerSearch.length === 0 ||
                event.ruleName.toLowerCase().includes(lowerSearch) ||
                event.fieldName.toLowerCase().includes(lowerSearch);
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && event.active) ||
                (statusFilter === 'resolved' && !event.active);
            return matchesSearch && matchesStatus;
        });
    }, [events, searchTerm, statusFilter]);

    const openCreateModal = () => {
        setEditingRule(null);
        setShowCustomDurationInput(false);
        setFormData({
            fieldId: selectedFieldId || fields[0]?.id || '',
            name: '',
            metric: AlertMetric.SOIL_HUMIDITY,
            operator: AlertOperator.BELOW,
            threshold: 0,
            durationMinutes: 15,
            notifyEmail: true,
            active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (rule: AlertRule) => {
        setEditingRule(rule);
        setShowCustomDurationInput(!durationOptions.includes(rule.durationMinutes));
        setFormData({
            fieldId: rule.fieldId,
            name: rule.name,
            metric: rule.metric,
            operator: rule.operator,
            threshold: rule.threshold,
            durationMinutes: rule.durationMinutes,
            notifyEmail: rule.notifyEmail,
            active: rule.active,
        });
        setIsModalOpen(true);
    };

    const saveRule = async () => {
        if (!formData.fieldId || !formData.name.trim()) {
            Alert.alert(t('common.error'), t('validation.required'));
            return;
        }
        try {
            if (editingRule) {
                await alertsService.updateRule(editingRule.id, formData);
            } else {
                await alertsService.createRule(formData);
            }
            setIsModalOpen(false);
            await fetchData();
        } catch (error) {
            console.error('Failed to save alert rule:', error);
            Alert.alert(t('common.error'), t('common.error'));
        }
    };

    const deleteRule = (ruleId: string) => {
        Alert.alert(t('common.confirm'), t('common.confirm'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('common.delete'),
                style: 'destructive',
                onPress: async () => {
                    try {
                        await alertsService.deleteRule(ruleId);
                        await fetchData();
                    } catch (error) {
                        console.error('Failed to delete alert rule:', error);
                    }
                },
            },
        ]);
    };

    const toggleRuleActive = async (rule: AlertRule) => {
        try {
            await alertsService.updateRule(rule.id, {
                fieldId: rule.fieldId,
                name: rule.name,
                metric: rule.metric,
                operator: rule.operator,
                threshold: rule.threshold,
                durationMinutes: rule.durationMinutes,
                notifyEmail: rule.notifyEmail,
                active: !rule.active,
            });
            await fetchData();
        } catch (error) {
            console.error('Failed to toggle alert rule:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await alertsService.markAllAsRead();
            await setBadgeCount(0);
            DeviceEventEmitter.emit('alerts:updated', 0);
            await fetchData();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const markEventRead = async (eventId: string) => {
        try {
            await alertsService.markAsRead(eventId);
            setEvents(prev =>
                prev.map(event => (event.id === eventId ? { ...event, read: true } : event))
            );
            const unreadCount = await alertsService.getUnreadCount();
            await setBadgeCount(unreadCount);
            DeviceEventEmitter.emit('alerts:updated', unreadCount);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const onRefresh = () => {
        setIsRefreshing(true);
        void fetchData(true);
    };

    const handleLogout = () => {
        Alert.alert(
            t('auth.logout_confirm_title'),
            t('auth.logout_confirm_message'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ],
            { cancelable: true },
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('alerts.title')}</Text>
                <TouchableOpacity style={styles.headerIcon} onPress={handleLogout}>
                    <LogOut color={theme.colors.chart.danger} size={20} />
                </TouchableOpacity>
            </View>

            <View style={styles.topTabs}>
                <TouchableOpacity
                    style={[styles.topTabButton, activeTab === 'rules' && styles.topTabButtonActive]}
                    onPress={() => {
                        setActiveTab('rules');
                        router.setParams({ tab: 'rules' });
                    }}
                >
                    <Bell color={activeTab === 'rules' ? '#fff' : theme.colors.neutral.subtext} size={16} />
                    <Text style={[styles.topTabText, activeTab === 'rules' && styles.topTabTextActive]}>{t('alerts.tab_rules')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.topTabButton, activeTab === 'history' && styles.topTabButtonActive]}
                    onPress={() => {
                        setActiveTab('history');
                        router.setParams({ tab: 'history' });
                    }}
                >
                    <Clock3 color={activeTab === 'history' ? '#fff' : theme.colors.neutral.subtext} size={16} />
                    <Text style={[styles.topTabText, activeTab === 'history' && styles.topTabTextActive]}>{t('alerts.tab_history')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.brand[500]} />}
            >
                <View style={styles.fieldFilterRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[styles.pill, !selectedFieldId && styles.pillActive]}
                            onPress={() => setSelectedFieldId('')}
                        >
                            <Text style={[styles.pillText, !selectedFieldId && styles.pillTextActive]}>{t('alerts.all_fields')}</Text>
                        </TouchableOpacity>
                        {fields.map(field => (
                            <TouchableOpacity
                                key={field.id}
                                style={[styles.pill, selectedFieldId === field.id && styles.pillActive]}
                                onPress={() => setSelectedFieldId(field.id)}
                            >
                                <Text style={[styles.pillText, selectedFieldId === field.id && styles.pillTextActive]}>{field.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    {activeTab === 'rules' && (
                        <TouchableOpacity style={styles.addRuleButton} onPress={openCreateModal}>
                            <Plus color="#fff" size={16} />
                            <Text style={styles.addRuleText}>{t('alerts.add_rule')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isLoading ? (
                    <View style={styles.loaderWrap}>
                        <ActivityIndicator size="large" color={theme.colors.brand[500]} />
                    </View>
                ) : activeTab === 'rules' ? (
                    <View>
                        {rules.length === 0 ? (
                            <Text style={styles.emptyText}>{t('alerts.no_rules')}</Text>
                        ) : (
                            rules.map(rule => (
                                <View key={rule.id} style={styles.card}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.ruleName}>{rule.name}</Text>
                                            <Text style={styles.ruleField}>{rule.fieldName}</Text>
                                        </View>
                                        <Switch
                                            value={rule.active}
                                            onValueChange={() => toggleRuleActive(rule)}
                                            trackColor={{ false: '#cbd5e1', true: theme.colors.brand[500] }}
                                        />
                                    </View>
                                    <Text style={styles.ruleCondition}>
                                        {t('alerts.condition_text_rule', {
                                            metric: formatMetric(rule.metric),
                                            value: `${operatorSymbol(rule.operator)} ${rule.threshold}`,
                                        })}
                                    </Text>
                                    <Text style={styles.ruleDuration}>{rule.durationMinutes}m</Text>
                                    <View style={styles.cardActions}>
                                        <TouchableOpacity style={styles.iconButton} onPress={() => openEditModal(rule)}>
                                            <Pencil color={theme.colors.neutral.subtext} size={16} />
                                            <Text style={styles.iconText}>{t('common.edit')}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.iconButton} onPress={() => deleteRule(rule.id)}>
                                            <Trash2 color={theme.colors.chart.danger} size={16} />
                                            <Text style={[styles.iconText, { color: theme.colors.chart.danger }]}>{t('common.delete')}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>
                ) : (
                    <View>
                        <View style={styles.historyHeader}>
                            <Text style={styles.historyDesc}>{t('alerts.history_desc')}</Text>
                            <TouchableOpacity style={styles.markReadBtn} onPress={markAllRead}>
                                <Text style={styles.markReadText}>{t('alerts.mark_all_read')}</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            value={searchTerm}
                            onChangeText={setSearchTerm}
                            placeholder={t('alerts.search_placeholder')}
                            placeholderTextColor={theme.colors.neutral.subtext}
                        />

                        <View style={styles.filterRow}>
                            <TouchableOpacity style={[styles.pill, statusFilter === 'all' && styles.pillActive]} onPress={() => setStatusFilter('all')}>
                                <Text style={[styles.pillText, statusFilter === 'all' && styles.pillTextActive]}>{t('alerts.filter_all')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.pill, statusFilter === 'active' && styles.pillActive]} onPress={() => setStatusFilter('active')}>
                                <Text style={[styles.pillText, statusFilter === 'active' && styles.pillTextActive]}>{t('alerts.filter_active')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.pill, statusFilter === 'resolved' && styles.pillActive]} onPress={() => setStatusFilter('resolved')}>
                                <Text style={[styles.pillText, statusFilter === 'resolved' && styles.pillTextActive]}>{t('alerts.filter_resolved')}</Text>
                            </TouchableOpacity>
                        </View>

                        {filteredEvents.length === 0 ? (
                            <Text style={styles.emptyText}>{t('alerts.no_events')}</Text>
                        ) : (
                            filteredEvents.map(event => {
                                const isUnreadActiveBreach = event.active && !event.read;
                                return (
                                    <View key={event.id} style={[styles.card, isUnreadActiveBreach && styles.activeEventCard]}>
                                        <Text style={styles.eventTitle}>{event.ruleName}</Text>
                                        <Text style={styles.eventField}>{event.fieldName}</Text>
                                        <Text style={styles.eventDetail}>
                                            {t('alerts.condition_text', {
                                                metric: formatMetric(event.metric),
                                                value: event.lastValue,
                                                threshold: event.threshold,
                                            })}
                                        </Text>
                                        <Text style={styles.eventTime}>
                                            {parseBackendUtcDate(event.triggeredAt)?.toLocaleString() ?? ''}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.eventStatus,
                                                !event.active
                                                    ? styles.resolvedStatus
                                                    : !event.read
                                                      ? styles.activeStatus
                                                      : styles.acknowledgedStatus,
                                            ]}
                                        >
                                            {!event.active
                                                ? `${t('alerts.resolved_at')} ${event.resolvedAt ? parseBackendUtcDate(event.resolvedAt)?.toLocaleTimeString() ?? '' : ''}`
                                                : !event.read
                                                  ? t('alerts.active_breach')
                                                  : t('alerts.acknowledged')}
                                        </Text>
                                        {!event.read && (
                                            <TouchableOpacity style={styles.markSingleReadBtn} onPress={() => markEventRead(event.id)}>
                                                <Check size={14} color={theme.colors.neutral.text} />
                                                <Text style={styles.markSingleReadText}>{t('alerts.mark_read')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}
            </ScrollView>

            <Modal visible={isModalOpen} animationType="slide" transparent>
                <Pressable style={styles.modalBackdrop} onPress={() => setIsModalOpen(false)} />
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{editingRule ? t('alerts.edit_rule_title') : t('alerts.create_rule_title')}</Text>
                        <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                            <X color={theme.colors.neutral.subtext} size={20} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.label}>{t('alerts.rule_name')}</Text>
                        <TextInput
                            style={styles.input}
                            value={formData.name}
                            onChangeText={value => setFormData(prev => ({ ...prev, name: value }))}
                        />

                        <Text style={styles.label}>{t('alerts.select_field')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {fields.map(field => (
                                <TouchableOpacity
                                    key={field.id}
                                    style={[styles.pill, formData.fieldId === field.id && styles.pillActive]}
                                    onPress={() => setFormData(prev => ({ ...prev, fieldId: field.id }))}
                                >
                                    <Text style={[styles.pillText, formData.fieldId === field.id && styles.pillTextActive]}>{field.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>{t('alerts.metric')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {metricOptions.map(metric => (
                                <TouchableOpacity
                                    key={metric}
                                    style={[styles.pill, formData.metric === metric && styles.pillActive]}
                                    onPress={() => setFormData(prev => ({ ...prev, metric }))}
                                >
                                    <Text style={[styles.pillText, formData.metric === metric && styles.pillTextActive]}>{formatMetric(metric)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.label}>{t('alerts.operator')}</Text>
                        <View style={styles.inlineRow}>
                            {operatorOptions.map(operator => (
                                <TouchableOpacity
                                    key={operator}
                                    style={[styles.pill, formData.operator === operator && styles.pillActive]}
                                    onPress={() => setFormData(prev => ({ ...prev, operator }))}
                                >
                                    <Text style={[styles.pillText, formData.operator === operator && styles.pillTextActive]}>
                                        {operator === AlertOperator.ABOVE ? '>' : '<'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>{t('alerts.threshold')}</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={`${formData.threshold}`}
                            onChangeText={value => setFormData(prev => ({ ...prev, threshold: Number(value) || 0 }))}
                        />

                        <Text style={styles.label}>{t('alerts.duration_min')}</Text>
                        <View style={styles.inlineRow}>
                            {durationOptions.map(duration => (
                                <TouchableOpacity
                                    key={duration}
                                    style={[styles.pill, formData.durationMinutes === duration && styles.pillActive]}
                                    onPress={() => {
                                        setDurationMinutes(duration);
                                        setShowCustomDurationInput(false);
                                    }}
                                >
                                    <Text style={[styles.pillText, formData.durationMinutes === duration && styles.pillTextActive]}>
                                        {duration}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[
                                    styles.pill,
                                    (showCustomDurationInput || !durationOptions.includes(formData.durationMinutes)) && styles.pillActive,
                                ]}
                                onPress={() => setShowCustomDurationInput(prev => !prev)}
                            >
                                <Text
                                    style={[
                                        styles.pillText,
                                        (showCustomDurationInput || !durationOptions.includes(formData.durationMinutes)) && styles.pillTextActive,
                                    ]}
                                >
                                    {t('alerts.custom_duration', 'Custom')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        {(showCustomDurationInput || !durationOptions.includes(formData.durationMinutes)) && (
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                placeholder={t('alerts.custom_duration_placeholder', 'Enter minutes')}
                                value={`${formData.durationMinutes}`}
                                onChangeText={value => {
                                    const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
                                    if (Number.isNaN(parsed)) return;
                                    setDurationMinutes(parsed);
                                }}
                            />
                        )}

                        <View style={styles.switchRow}>
                            <Text style={styles.label}>{t('alerts.send_email')}</Text>
                            <Switch
                                value={formData.notifyEmail}
                                onValueChange={value => setFormData(prev => ({ ...prev, notifyEmail: value }))}
                                trackColor={{ false: '#cbd5e1', true: theme.colors.brand[500] }}
                            />
                        </View>

                        <View style={styles.switchRow}>
                            <Text style={styles.label}>{t('alerts.col_status')}</Text>
                            <Switch
                                value={formData.active}
                                onValueChange={value => setFormData(prev => ({ ...prev, active: value }))}
                                trackColor={{ false: '#cbd5e1', true: theme.colors.brand[500] }}
                            />
                        </View>
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setIsModalOpen(false)}>
                            <Text style={styles.secondaryBtnText}>{t('alerts.cancel')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.primaryBtn} onPress={saveRule}>
                            <Text style={styles.primaryBtnText}>{t('alerts.save_rule')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
    },
    title: { fontSize: 20, fontWeight: '700', color: theme.colors.neutral.dark },
    headerIcon: { padding: 8 },
    topTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 14 },
    topTabButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#fff',
    },
    topTabButtonActive: {
        backgroundColor: theme.colors.brand[500],
        borderColor: theme.colors.brand[500],
    },
    topTabText: { color: theme.colors.neutral.subtext, fontWeight: '600' },
    topTabTextActive: { color: '#fff' },
    content: { padding: 20, paddingBottom: 120 },
    fieldFilterRow: { gap: 10, marginBottom: 12 },
    pill: {
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        backgroundColor: '#fff',
    },
    pillActive: { borderColor: theme.colors.brand[500], backgroundColor: theme.colors.brand[50] },
    pillText: { color: theme.colors.neutral.subtext, fontSize: 12, fontWeight: '600' },
    pillTextActive: { color: theme.colors.brand[600] },
    addRuleButton: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.brand[500],
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    addRuleText: { color: '#fff', fontWeight: '700' },
    loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
    emptyText: { color: theme.colors.neutral.subtext, textAlign: 'center', marginTop: 28, fontSize: 14 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        padding: 14,
        marginBottom: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    ruleName: { fontSize: 15, fontWeight: '700', color: theme.colors.neutral.dark },
    ruleField: { marginTop: 2, fontSize: 12, color: theme.colors.neutral.subtext },
    ruleCondition: { marginTop: 10, color: theme.colors.neutral.text, fontSize: 13 },
    ruleDuration: { marginTop: 4, color: theme.colors.neutral.subtext, fontSize: 12 },
    cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14, marginTop: 10 },
    iconButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    iconText: { color: theme.colors.neutral.subtext, fontSize: 12, fontWeight: '600' },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    historyDesc: { color: theme.colors.neutral.subtext, flex: 1, marginRight: 8 },
    markReadBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
    },
    markReadText: { color: theme.colors.neutral.text, fontSize: 12, fontWeight: '600' },
    markSingleReadBtn: {
        marginTop: 8,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: '#fff',
    },
    markSingleReadText: { color: theme.colors.neutral.text, fontSize: 12, fontWeight: '600' },
    searchInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.colors.neutral.dark,
        marginBottom: 10,
    },
    filterRow: { flexDirection: 'row', marginBottom: 8 },
    activeEventCard: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
    eventTitle: { fontWeight: '700', color: theme.colors.neutral.dark },
    eventField: { marginTop: 2, color: theme.colors.neutral.subtext, fontSize: 12 },
    eventDetail: { marginTop: 8, color: theme.colors.neutral.text, fontSize: 13 },
    eventTime: { marginTop: 6, color: theme.colors.neutral.subtext, fontSize: 12 },
    eventStatus: { marginTop: 8, fontWeight: '700', fontSize: 12 },
    activeStatus: { color: '#b91c1c' },
    resolvedStatus: { color: '#166534' },
    acknowledgedStatus: { color: '#0369a1' },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.5)' },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        maxHeight: '85%',
        paddingTop: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.neutral.dark },
    modalContent: { padding: 18, gap: 8, paddingBottom: 24 },
    label: { color: theme.colors.neutral.text, fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 6 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.colors.neutral.dark,
    },
    inlineRow: { flexDirection: 'row', flexWrap: 'wrap' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: theme.colors.neutral.border,
        padding: 16,
    },
    primaryBtn: {
        backgroundColor: theme.colors.brand[500],
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    primaryBtnText: { color: '#fff', fontWeight: '700' },
    secondaryBtn: {
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    secondaryBtnText: { color: theme.colors.neutral.text, fontWeight: '600' },
});
