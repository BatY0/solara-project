import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Box,
    Button,
    CloseButton,
    Dialog,
    Flex,
    Input,
    Portal,
    Spinner,
    Text,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { adminDashboardService } from "../../../features/admin/adminDashboard.service";
import type {
    DashboardStats,
    UserDetail,
    UserDetailsResponse,
    UserRole,
} from "../../../features/admin/adminDashboard.types";

const PAGE_SIZE = 10;

type SortKey = "name" | "createdAt" | "fieldCount" | "deviceCount" | "analysisCount" | "sensorLogsCount";
type SortDirection = "asc" | "desc";

const safeDate = (value?: string): string => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const roleOptions: UserRole[] = ["USER", "ADMIN"];

export const AdminUserDashboard = () => {
    const { t } = useTranslation();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    const [page, setPage] = useState(0);
    const [users, setUsers] = useState<UserDetail[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [isUsersLoading, setIsUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedDetails, setSelectedDetails] = useState<UserDetailsResponse | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState<string | null>(null);

    const [roleDraft, setRoleDraft] = useState<UserRole>("USER");
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);

    const [deleteCandidate, setDeleteCandidate] = useState<UserDetail | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const loadStats = useCallback(async () => {
        setIsStatsLoading(true);
        try {
            const data = await adminDashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load admin dashboard stats", error);
            setStats(null);
        } finally {
            setIsStatsLoading(false);
        }
    }, []);

    const loadUsers = useCallback(async (nextPage: number) => {
        setIsUsersLoading(true);
        setUsersError(null);
        try {
            const data = await adminDashboardService.getUsers(nextPage, PAGE_SIZE);
            setUsers(data.users.content);
            setTotalPages(data.users.totalPages);
            setTotalUsers(data.totalUsers);
            setPage(data.users.number);
        } catch (error) {
            console.error("Failed to load admin users", error);
            setUsers([]);
            setTotalPages(0);
            setTotalUsers(0);
            setUsersError(t("admin_dashboard.errors.users_load"));
        } finally {
            setIsUsersLoading(false);
        }
    }, [t]);

    const loadUserDetails = useCallback(async (userId: string) => {
        setIsDetailsLoading(true);
        setDetailsError(null);
        try {
            const data = await adminDashboardService.getUserDetails(userId);
            setSelectedDetails(data);
            setRoleDraft(data.user.role);
        } catch (error) {
            console.error("Failed to load user details", error);
            setSelectedDetails(null);
            setDetailsError(t("admin_dashboard.errors.details_load"));
        } finally {
            setIsDetailsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        void loadStats();
    }, [loadStats]);

    useEffect(() => {
        void loadUsers(page);
    }, [loadUsers, page]);

    const visibleUsers = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();
        const searched = users.filter((item) => {
            const matchesSearch =
                normalizedSearch.length === 0 ||
                item.user.name.toLowerCase().includes(normalizedSearch) ||
                item.user.surname.toLowerCase().includes(normalizedSearch) ||
                item.user.email.toLowerCase().includes(normalizedSearch);
            const matchesRole = roleFilter === "ALL" || item.user.role === roleFilter;
            return matchesSearch && matchesRole;
        });

        const sorted = [...searched].sort((left, right) => {
            const leftValue =
                sortKey === "name"
                    ? `${left.user.name} ${left.user.surname}`.toLowerCase()
                    : sortKey === "createdAt"
                        ? new Date(left.user.createdAt).getTime()
                        : left[sortKey];
            const rightValue =
                sortKey === "name"
                    ? `${right.user.name} ${right.user.surname}`.toLowerCase()
                    : sortKey === "createdAt"
                        ? new Date(right.user.createdAt).getTime()
                        : right[sortKey];

            if (leftValue < rightValue) return sortDirection === "asc" ? -1 : 1;
            if (leftValue > rightValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [users, search, roleFilter, sortKey, sortDirection]);

    const onSelectUser = (userId: string) => {
        setSelectedUserId(userId);
        void loadUserDetails(userId);
    };

    const onUpdateRole = async () => {
        if (!selectedUserId || !selectedDetails) return;
        setIsUpdatingRole(true);
        setActionError(null);
        try {
            await adminDashboardService.updateUserRole(selectedUserId, roleDraft);
            await Promise.all([loadUsers(page), loadUserDetails(selectedUserId), loadStats()]);
        } catch (error) {
            console.error("Failed to update user role", error);
            setActionError(t("admin_dashboard.errors.role_update"));
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const onConfirmDelete = async () => {
        if (!deleteCandidate) return;
        setIsDeleting(true);
        setActionError(null);
        try {
            await adminDashboardService.deleteUser(deleteCandidate.user.id);
            const shouldGoBackPage = users.length === 1 && page > 0;
            const targetPage = shouldGoBackPage ? page - 1 : page;
            if (selectedUserId === deleteCandidate.user.id) {
                setSelectedUserId(null);
                setSelectedDetails(null);
            }
            setDeleteCandidate(null);
            await Promise.all([loadUsers(targetPage), loadStats()]);
        } catch (error) {
            console.error("Failed to delete user", error);
            setActionError(t("admin_dashboard.errors.user_delete"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <DashboardLayout title={t("admin_dashboard.title")} subtitle={t("admin_dashboard.subtitle")}>
            <Dialog.Root
                role="alertdialog"
                open={Boolean(deleteCandidate)}
                onOpenChange={(event) => {
                    if (!event.open) setDeleteCandidate(null);
                }}
                placement="center"
            >
                <Portal>
                    <Dialog.Backdrop bg="blackAlpha.500" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t("admin_dashboard.delete.title")}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text>
                                    {t("admin_dashboard.delete.confirm", {
                                        name: deleteCandidate?.user.name ?? "",
                                        surname: deleteCandidate?.user.surname ?? "",
                                        email: deleteCandidate?.user.email ?? "",
                                    })}
                                </Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline">{t("admin_dashboard.actions.cancel")}</Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="red" loading={isDeleting} onClick={onConfirmDelete}>
                                    {t("admin_dashboard.actions.delete_user")}
                                </Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild>
                                <CloseButton size="sm" />
                            </Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            <Flex direction="column" gap={6}>
                <Flex wrap="wrap" gap={3}>
                    <Box flex="1 1 180px" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Text fontSize="sm" color="neutral.subtext">{t("admin_dashboard.stats.total_users")}</Text>
                        <Text fontSize="2xl" fontWeight="bold">{isStatsLoading ? "-" : stats?.totalUsers ?? 0}</Text>
                    </Box>
                    <Box flex="1 1 180px" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Text fontSize="sm" color="neutral.subtext">{t("admin_dashboard.stats.total_fields")}</Text>
                        <Text fontSize="2xl" fontWeight="bold">{isStatsLoading ? "-" : stats?.totalFields ?? 0}</Text>
                    </Box>
                    <Box flex="1 1 180px" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Text fontSize="sm" color="neutral.subtext">{t("admin_dashboard.stats.total_devices")}</Text>
                        <Text fontSize="2xl" fontWeight="bold">{isStatsLoading ? "-" : stats?.totalDevices ?? 0}</Text>
                    </Box>
                    <Box flex="1 1 180px" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Text fontSize="sm" color="neutral.subtext">{t("admin_dashboard.stats.total_analysis_logs")}</Text>
                        <Text fontSize="2xl" fontWeight="bold">{isStatsLoading ? "-" : stats?.totalAnalysisLogs ?? 0}</Text>
                    </Box>
                    <Box flex="1 1 180px" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Text fontSize="sm" color="neutral.subtext">{t("admin_dashboard.stats.total_sensor_logs")}</Text>
                        <Text fontSize="2xl" fontWeight="bold">{isStatsLoading ? "-" : stats?.totalSensorLogs ?? 0}</Text>
                    </Box>
                </Flex>

                <Box bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                    <Flex wrap="wrap" gap={3}>
                        <Input
                            flex="2 1 240px"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder={t("admin_dashboard.filters.search_placeholder")}
                        />
                        <Box flex="1 1 180px">
                            <select
                                style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                                value={roleFilter}
                                onChange={(event) => setRoleFilter(event.target.value as "ALL" | UserRole)}
                            >
                                <option value="ALL">{t("admin_dashboard.filters.all_roles")}</option>
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </Box>
                        <Box flex="1 1 180px">
                            <select
                                style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                                value={sortKey}
                                onChange={(event) => setSortKey(event.target.value as SortKey)}
                            >
                                <option value="createdAt">{t("admin_dashboard.filters.sort_created_at")}</option>
                                <option value="name">{t("admin_dashboard.filters.sort_name")}</option>
                                <option value="fieldCount">{t("admin_dashboard.filters.sort_fields")}</option>
                                <option value="deviceCount">{t("admin_dashboard.filters.sort_devices")}</option>
                                <option value="analysisCount">{t("admin_dashboard.filters.sort_analysis")}</option>
                                <option value="sensorLogsCount">{t("admin_dashboard.filters.sort_sensor_logs")}</option>
                            </select>
                        </Box>
                        <Box flex="1 1 150px">
                            <select
                                style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                                value={sortDirection}
                                onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                            >
                                <option value="desc">{t("admin_dashboard.filters.desc")}</option>
                                <option value="asc">{t("admin_dashboard.filters.asc")}</option>
                            </select>
                        </Box>
                    </Flex>
                </Box>

                <Flex gap={4} direction={{ base: "column", xl: "row" }} align="stretch">
                    <Box flex="1.1" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Flex justify="space-between" align="center" mb={4}>
                            <Text fontWeight="bold">{t("admin_dashboard.users.title")}</Text>
                            <Text fontSize="sm" color="neutral.subtext">
                                {t("admin_dashboard.users.total", { count: totalUsers })}
                            </Text>
                        </Flex>

                        {isUsersLoading ? (
                            <Flex minH="260px" align="center" justify="center">
                                <Spinner />
                            </Flex>
                        ) : usersError ? (
                            <Text color="red.500">{usersError}</Text>
                        ) : visibleUsers.length === 0 ? (
                            <Text color="neutral.subtext">{t("admin_dashboard.users.empty")}</Text>
                        ) : (
                            <Flex direction="column" gap={3}>
                                {visibleUsers.map((item) => {
                                    const isSelected = item.user.id === selectedUserId;
                                    return (
                                        <Box
                                            key={item.user.id}
                                            border="1px solid"
                                            borderColor={isSelected ? "brand.300" : "neutral.border"}
                                            borderRadius="lg"
                                            p={3}
                                            cursor="pointer"
                                            bg={isSelected ? "brand.50" : "white"}
                                            onClick={() => onSelectUser(item.user.id)}
                                        >
                                            <Flex justify="space-between" align="center" gap={3}>
                                                <Box minW={0}>
                                                    <Text fontWeight="semibold" truncate>
                                                        {item.user.name} {item.user.surname}
                                                    </Text>
                                                    <Text fontSize="sm" color="neutral.subtext" truncate>
                                                        {item.user.email}
                                                    </Text>
                                                    <Text fontSize="xs" mt={1} color="neutral.subtext">
                                                        {t("admin_dashboard.users.meta", {
                                                            role: item.user.role,
                                                            fields: item.fieldCount,
                                                            devices: item.deviceCount,
                                                        })}
                                                    </Text>
                                                </Box>
                                                <Button
                                                    size="xs"
                                                    colorPalette="red"
                                                    variant="outline"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setDeleteCandidate(item);
                                                    }}
                                                >
                                                    {t("admin_dashboard.actions.delete_user")}
                                                </Button>
                                            </Flex>
                                        </Box>
                                    );
                                })}
                            </Flex>
                        )}

                        <Flex justify="space-between" align="center" mt={4}>
                            <Button
                                variant="outline"
                                disabled={page <= 0 || isUsersLoading}
                                onClick={() => setPage((current) => Math.max(0, current - 1))}
                            >
                                {t("admin_dashboard.pagination.previous")}
                            </Button>
                            <Text fontSize="sm" color="neutral.subtext">
                                {t("admin_dashboard.pagination.page", { current: page + 1, total: Math.max(totalPages, 1) })}
                            </Text>
                            <Button
                                variant="outline"
                                disabled={isUsersLoading || page >= Math.max(totalPages - 1, 0)}
                                onClick={() => setPage((current) => current + 1)}
                            >
                                {t("admin_dashboard.pagination.next")}
                            </Button>
                        </Flex>
                    </Box>

                    <Box flex="1" bg="white" borderRadius="xl" border="1px solid" borderColor="neutral.border" p={4}>
                        <Text fontWeight="bold" mb={4}>{t("admin_dashboard.details.title")}</Text>

                        {isDetailsLoading ? (
                            <Flex minH="260px" align="center" justify="center">
                                <Spinner />
                            </Flex>
                        ) : detailsError ? (
                            <Text color="red.500">{detailsError}</Text>
                        ) : !selectedDetails ? (
                            <Text color="neutral.subtext">{t("admin_dashboard.details.empty")}</Text>
                        ) : (
                            <Flex direction="column" gap={4}>
                                <Box border="1px solid" borderColor="neutral.border" borderRadius="lg" p={3}>
                                    <Text fontWeight="semibold">
                                        {selectedDetails.user.name} {selectedDetails.user.surname}
                                    </Text>
                                    <Text fontSize="sm" color="neutral.subtext">{selectedDetails.user.email}</Text>
                                    <Text fontSize="xs" color="neutral.subtext" mt={1}>
                                        {t("admin_dashboard.details.member_since", { value: safeDate(selectedDetails.user.createdAt) })}
                                    </Text>
                                </Box>

                                <Flex wrap="wrap" gap={2}>
                                    <Box bg="gray.50" borderRadius="md" px={3} py={2}>
                                        <Text fontSize="xs" color="neutral.subtext">{t("admin_dashboard.stats.total_fields")}</Text>
                                        <Text fontWeight="bold">{selectedDetails.totalFields}</Text>
                                    </Box>
                                    <Box bg="gray.50" borderRadius="md" px={3} py={2}>
                                        <Text fontSize="xs" color="neutral.subtext">{t("admin_dashboard.stats.total_devices")}</Text>
                                        <Text fontWeight="bold">{selectedDetails.totalDevices}</Text>
                                    </Box>
                                    <Box bg="gray.50" borderRadius="md" px={3} py={2}>
                                        <Text fontSize="xs" color="neutral.subtext">{t("admin_dashboard.stats.total_sensor_logs")}</Text>
                                        <Text fontWeight="bold">{selectedDetails.totalSensorLogs}</Text>
                                    </Box>
                                    <Box bg="gray.50" borderRadius="md" px={3} py={2}>
                                        <Text fontSize="xs" color="neutral.subtext">{t("admin_dashboard.stats.total_analysis_logs")}</Text>
                                        <Text fontWeight="bold">{selectedDetails.totalAnalysisLogs}</Text>
                                    </Box>
                                </Flex>

                                <Box border="1px solid" borderColor="neutral.border" borderRadius="lg" p={3}>
                                    <Text fontWeight="semibold" mb={2}>{t("admin_dashboard.details.role_management")}</Text>
                                    <Flex gap={2}>
                                        <Box flex={1}>
                                            <select
                                                style={{ width: "100%", padding: "10px", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                                                value={roleDraft}
                                                onChange={(event) => setRoleDraft(event.target.value as UserRole)}
                                            >
                                                {roleOptions.map((role) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                        </Box>
                                        <Button
                                            colorPalette="blue"
                                            loading={isUpdatingRole}
                                            disabled={roleDraft === selectedDetails.user.role}
                                            onClick={onUpdateRole}
                                        >
                                            {t("admin_dashboard.actions.update_role")}
                                        </Button>
                                    </Flex>
                                </Box>

                                <Box border="1px solid" borderColor="neutral.border" borderRadius="lg" p={3}>
                                    <Text fontWeight="semibold" mb={2}>{t("admin_dashboard.details.fields_title")}</Text>
                                    {selectedDetails.fields.length === 0 ? (
                                        <Text fontSize="sm" color="neutral.subtext">{t("admin_dashboard.details.no_fields")}</Text>
                                    ) : (
                                        <Flex direction="column" gap={2}>
                                            {selectedDetails.fields.map((item) => (
                                                <Box key={item.field.id} bg="gray.50" borderRadius="md" p={2}>
                                                    <Text fontWeight="medium">{item.field.name}</Text>
                                                    <Text fontSize="sm" color="neutral.subtext">
                                                        {t("admin_dashboard.details.field_meta", {
                                                            soilType: item.field.soilType || "-",
                                                            areaHa: item.field.areaHa,
                                                        })}
                                                    </Text>
                                                    <Text fontSize="sm" color="neutral.subtext">
                                                        {item.device
                                                            ? t("admin_dashboard.details.device_attached", { serialNumber: item.device.serialNumber })
                                                            : t("admin_dashboard.details.no_device")}
                                                    </Text>
                                                </Box>
                                            ))}
                                        </Flex>
                                    )}
                                </Box>
                            </Flex>
                        )}
                    </Box>
                </Flex>

                {actionError && (
                    <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md" p={3}>
                        <Text color="red.600">{actionError}</Text>
                    </Box>
                )}
            </Flex>
        </DashboardLayout>
    );
};
