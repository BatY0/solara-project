import { useEffect, useState } from "react";
import { Box, Button, CloseButton, Dialog, Flex, Portal, Spinner, Text, Input } from "@chakra-ui/react";
import { Plus, Trash2, Unplug, Link } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DashboardLayout } from "../../../components/layout/DashboardLayout";
import { adminDeviceService } from "../../../features/devices/adminDevice.service";
import { fieldsService } from "../../../features/fields/fields.service";
import type { EspDeviceResponse } from "../../../features/devices/deviceTypes";
import type { Field } from "../../../features/fields/types";

export const EspDeviceAdminList = () => {
    const { t } = useTranslation();
    const [items, setItems] = useState<EspDeviceResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Register Dialog
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [newSerialNumber, setNewSerialNumber] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    // Delete Dialog
    const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<{ id: string; serialNumber: string } | null>(null);

    // Assign Dialog
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assigningDeviceId, setAssigningDeviceId] = useState<string | null>(null);
    const [fieldsOptions, setFieldsOptions] = useState<Field[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string>("");
    const [isAssigning, setIsAssigning] = useState(false);

    const load = async () => {
        setIsLoading(true);
        try {
            setItems(await adminDeviceService.list());
        } catch (err) {
            console.error("Failed to load device admin list", err);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadFieldsForAssign = async () => {
        try {
            const allFields = await fieldsService.getAllFields();
            setFieldsOptions(allFields);
        } catch (err) {
            console.error("Failed to load fields", err);
        }
    }

    useEffect(() => {
        load();
        loadFieldsForAssign();
    }, []);

    const openDeleteDialog = (id: string, serialNumber: string) => {
        setSelectedDevice({ id, serialNumber });
        setIsDeleteDialogOpen(true);
    };

    const onConfirmDelete = async () => {
        if (!selectedDevice) return;
        setIsDeletingId(selectedDevice.id);
        try {
            await adminDeviceService.delete(selectedDevice.id);
            await load();
            setIsDeleteDialogOpen(false);
            setSelectedDevice(null);
        } catch (err) {
            console.error("Failed to delete device", err);
        } finally {
            setIsDeletingId(null);
        }
    };

    const onRegister = async () => {
        if (!newSerialNumber.trim()) return;
        setIsRegistering(true);
        try {
            await adminDeviceService.create({ serialNumber: newSerialNumber, status: "AVAILABLE" });
            setNewSerialNumber("");
            setIsRegisterOpen(false);
            await load();
        } catch (err) {
            console.error("Failed to register device", err);
        } finally {
            setIsRegistering(false);
        }
    };

    const onDisconnect = async (deviceId: string) => {
        try {
            await adminDeviceService.disconnectFromField(deviceId);
            await load();
        } catch (err) {
            console.error("Failed to disconnect", err);
        }
    };

    const openAssignDialog = (deviceId: string) => {
        setAssigningDeviceId(deviceId);
        setIsAssignOpen(true);
    }

    const onConfirmAssign = async () => {
        if (!assigningDeviceId || !selectedFieldId) return;
        setIsAssigning(true);
        try {
            await adminDeviceService.assignToField(assigningDeviceId, selectedFieldId);
            setIsAssignOpen(false);
            setAssigningDeviceId(null);
            setSelectedFieldId("");
            await load();
        } catch(err) {
             console.error("Failed to assign device", err);
        } finally {
             setIsAssigning(false);
        }
    }

    return (
        <DashboardLayout title={t("admin_devices.title")} subtitle={t("admin_devices.subtitle")}>
            {/* Delete Dialog */}
            <Dialog.Root role="alertdialog" open={isDeleteDialogOpen} onOpenChange={(e) => { setIsDeleteDialogOpen(e.open); if (!e.open) setSelectedDevice(null); }}>
                <Portal>
                    <Dialog.Backdrop bg="blackAlpha.500" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t("admin_devices.delete_title")}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Text>{t("admin_devices.delete_confirm")} <b>{selectedDevice?.serialNumber}</b>? {t("admin_devices.delete_warning")}</Text>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild>
                                    <Button variant="outline">{t("admin_devices.cancel")}</Button>
                                </Dialog.ActionTrigger>
                                <Button colorPalette="red" loading={isDeletingId === selectedDevice?.id} onClick={onConfirmDelete}>{t("admin_devices.delete_btn")}</Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* Register Dialog */}
            <Dialog.Root open={isRegisterOpen} onOpenChange={(e) => setIsRegisterOpen(e.open)}>
                <Portal>
                    <Dialog.Backdrop bg="blackAlpha.500" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t("admin_devices.register_title")}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Flex direction="column" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="semibold" mb={1}>{t("admin_devices.serial_number")}</Text>
                                        <Input 
                                            placeholder="ESP32-XXX-YYY" 
                                            value={newSerialNumber}
                                            onChange={(e) => setNewSerialNumber(e.target.value)} 
                                        />
                                    </Box>
                                </Flex>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild><Button variant="outline">{t("admin_devices.cancel")}</Button></Dialog.ActionTrigger>
                                <Button colorPalette="blue" loading={isRegistering} onClick={onRegister}>{t("admin_devices.register_btn")}</Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            {/* Assign Dialog */}
            <Dialog.Root open={isAssignOpen} onOpenChange={(e) => setIsAssignOpen(e.open)}>
                <Portal>
                    <Dialog.Backdrop bg="blackAlpha.500" />
                    <Dialog.Positioner>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>{t("admin_devices.assign_title")}</Dialog.Title>
                            </Dialog.Header>
                            <Dialog.Body>
                                <Flex direction="column" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="semibold" mb={1}>{t("admin_devices.select_field")}</Text>
                                        <select 
                                            style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "8px" }}
                                            value={selectedFieldId} 
                                            onChange={(e) => setSelectedFieldId(e.target.value)}
                                        >
                                            <option value="" disabled>{t("admin_devices.select_placeholder")}</option>
                                            {fieldsOptions.map(f => (
                                                <option key={f.id} value={f.id}>{f.name} ({t("admin_devices.owner_id")}: {f.userId})</option>
                                            ))}
                                        </select>
                                    </Box>
                                </Flex>
                            </Dialog.Body>
                            <Dialog.Footer>
                                <Dialog.ActionTrigger asChild><Button variant="outline">{t("admin_devices.cancel")}</Button></Dialog.ActionTrigger>
                                <Button colorPalette="blue" loading={isAssigning} onClick={onConfirmAssign}>{t("admin_devices.assign_btn")}</Button>
                            </Dialog.Footer>
                            <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog.Root>

            <Flex direction="column" gap={4}>
                <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} direction={{ base: "column", sm: "row" }} gap={3}>
                    <Text fontWeight="semibold">{t("admin_devices.registry")}</Text>
                    <Button colorPalette="green" onClick={() => setIsRegisterOpen(true)} w={{ base: "full", sm: "auto" }}>
                        <Plus size={14} />
                        {t("admin_devices.new_device")}
                    </Button>
                </Flex>

                {isLoading ? (
                    <Flex minH="40vh" align="center" justify="center">
                        <Spinner />
                    </Flex>
                ) : (
                    <Flex direction="column" gap={3}>
                        {items.length === 0 && (
                            <Text color="gray.500" textAlign="center" mt={4}>{t("admin_devices.no_devices")}</Text>
                        )}
                        {items.map((item) => (
                            <Box key={item.id} bg="white" border="1px solid" borderColor="neutral.border" borderRadius="xl" p={4}>
                                <Flex
                                    align={{ base: "stretch", md: "center" }}
                                    justify="space-between"
                                    direction={{ base: "column", md: "row" }}
                                    gap={3}
                                >
                                    <Box minW={0}>
                                        <Text fontWeight="bold" wordBreak="break-word">{item.serialNumber}</Text>
                                        {item.pairedFieldName ? (
                                            <Text color="green.600" fontSize="sm" fontWeight="medium" wordBreak="break-word">
                                                {t("admin_devices.tracking")}: {item.pairedFieldName} (ID: {item.pairedFieldId})
                                            </Text>
                                        ) : (
                                            <Text color="orange.500" fontSize="sm" fontWeight="medium">
                                                {t("admin_devices.available")}
                                            </Text>
                                        )}
                                    </Box>

                                    <Flex gap={2} wrap="wrap" justify={{ base: "stretch", md: "flex-end" }}>
                                        {item.pairedFieldName ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorPalette="orange"
                                                onClick={() => onDisconnect(item.id)}
                                                w={{ base: "full", sm: "auto" }}
                                            >
                                                <Unplug size={14} /> {t("admin_devices.disconnect")}
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                colorPalette="blue"
                                                onClick={() => openAssignDialog(item.id)}
                                                w={{ base: "full", sm: "auto" }}
                                            >
                                                <Link size={14} /> {t("admin_devices.assign_field")}
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            colorPalette="red"
                                            onClick={() => openDeleteDialog(item.id, item.serialNumber)}
                                            w={{ base: "full", sm: "auto" }}
                                        >
                                            <Trash2 size={14} />
                                            {t("admin_devices.delete_btn")}
                                        </Button>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))}
                    </Flex>
                )}
            </Flex>
        </DashboardLayout>
    );
};
