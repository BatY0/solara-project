import type { RefObject } from "react";
import { Button, CloseButton, Dialog, Field as ChakraField, Input, Portal, Text } from "@chakra-ui/react";

interface DeleteFieldDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    cancelLabel: string;
    confirmLabel: string;
    isDeleting: boolean;
    onConfirm: () => void;
}

interface UnpairDeviceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    cancelLabel: string;
    confirmLabel: string;
    isUnpairing: boolean;
    onConfirm: () => void;
}

interface PairDeviceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialFocusEl?: () => HTMLElement | null;
    macLabel: string;
    macPlaceholder: string;
    macHelper: string;
    pairTitle: string;
    cancelLabel: string;
    pairLabel: string;
    macInput: string;
    pairError: string | null;
    isPairing: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onMacChange: (value: string) => void;
    onConfirm: () => void;
}

export function DeleteFieldDialog({
    open,
    onOpenChange,
    title,
    description,
    cancelLabel,
    confirmLabel,
    isDeleting,
    onConfirm,
}: DeleteFieldDialogProps) {
    return (
        <Dialog.Root role="alertdialog" open={open} onOpenChange={e => onOpenChange(e.open)} placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                <Dialog.Positioner><Dialog.Content>
                    <Dialog.Header><Dialog.Title>{title}</Dialog.Title></Dialog.Header>
                    <Dialog.Body><Text>{description}</Text></Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button></Dialog.ActionTrigger>
                        <Button colorPalette="red" onClick={onConfirm} loading={isDeleting}>{confirmLabel}</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                </Dialog.Content></Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

export function UnpairDeviceDialog({
    open,
    onOpenChange,
    title,
    description,
    cancelLabel,
    confirmLabel,
    isUnpairing,
    onConfirm,
}: UnpairDeviceDialogProps) {
    return (
        <Dialog.Root role="alertdialog" open={open} onOpenChange={e => onOpenChange(e.open)} placement="center">
            <Portal>
                <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                <Dialog.Positioner><Dialog.Content>
                    <Dialog.Header><Dialog.Title>{title}</Dialog.Title></Dialog.Header>
                    <Dialog.Body><Text>{description}</Text></Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button></Dialog.ActionTrigger>
                        <Button colorPalette="red" onClick={onConfirm} loading={isUnpairing}>{confirmLabel}</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                </Dialog.Content></Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}

export function PairDeviceDialog({
    open,
    onOpenChange,
    initialFocusEl,
    macLabel,
    macPlaceholder,
    macHelper,
    pairTitle,
    cancelLabel,
    pairLabel,
    macInput,
    pairError,
    isPairing,
    inputRef,
    onMacChange,
    onConfirm,
}: PairDeviceDialogProps) {
    return (
        <Dialog.Root open={open} onOpenChange={e => onOpenChange(e.open)} placement="center" initialFocusEl={initialFocusEl}>
            <Portal>
                <Dialog.Backdrop backdropFilter="auto" backdropBlur="sm" />
                <Dialog.Positioner><Dialog.Content>
                    <Dialog.Header><Dialog.Title>{pairTitle}</Dialog.Title></Dialog.Header>
                    <Dialog.Body pb={4}>
                        <ChakraField.Root invalid={!!pairError}>
                            <ChakraField.Label>{macLabel}</ChakraField.Label>
                            <Input
                                ref={inputRef}
                                placeholder={macPlaceholder}
                                value={macInput}
                                onChange={e => onMacChange(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && onConfirm()}
                            />
                            {pairError ? <ChakraField.ErrorText>{pairError}</ChakraField.ErrorText> : <ChakraField.HelperText>{macHelper}</ChakraField.HelperText>}
                        </ChakraField.Root>
                    </Dialog.Body>
                    <Dialog.Footer>
                        <Dialog.ActionTrigger asChild><Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel}</Button></Dialog.ActionTrigger>
                        <Button colorPalette="brand" onClick={onConfirm} loading={isPairing} disabled={!macInput.trim()}>{pairLabel}</Button>
                    </Dialog.Footer>
                    <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                </Dialog.Content></Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
