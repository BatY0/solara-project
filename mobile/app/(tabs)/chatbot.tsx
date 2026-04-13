import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Send, X } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { theme } from '../../src/theme/theme';
import { chatService } from '../../src/services/chatService';
import type { ChatMessage } from '../../src/types/chat';

const firstParam = (value: string | string[] | undefined): string | undefined => {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
};

export default function ChatbotScreen() {
    const params = useLocalSearchParams<{ cropId?: string | string[]; cropName?: string | string[] }>();
    const { t } = useTranslation();

    const initialCropId = firstParam(params.cropId);
    const initialCropName = firstParam(params.cropName);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [threadId, setThreadId] = useState<string | undefined>();
    const [prompt, setPrompt] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [contextCropId, setContextCropId] = useState<string | undefined>(initialCropId);
    const [contextCropName, setContextCropName] = useState<string | undefined>(initialCropName);

    useEffect(() => {
        setContextCropId(initialCropId);
        setContextCropName(initialCropName);
        setThreadId(undefined);
        setMessages([]);
    }, [initialCropId, initialCropName]);

    const sendMessage = useCallback(async () => {
        const cleanedPrompt = prompt.trim();
        if (!cleanedPrompt || isSending) return;

        setPrompt('');
        setIsSending(true);

        const optimisticUserMessage: ChatMessage = {
            id: `tmp-${Date.now()}`,
            role: 'user',
            text: cleanedPrompt,
            threadId: threadId ?? 'pending',
            cropId: contextCropId ?? null,
            createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);

        try {
            const responseMessage = await chatService.sendPrompt({
                prompt: cleanedPrompt,
                cropId: contextCropId,
                threadId,
            });

            setThreadId(responseMessage.threadId);
            setMessages((prev) => [...prev, responseMessage]);
        } catch (error) {
            setMessages((prev) => prev.filter((item) => item.id !== optimisticUserMessage.id));
            const message = error instanceof Error ? error.message : t('chatbot.errors.general');
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'chatbot',
                    text: message,
                    threadId: threadId ?? 'error',
                    cropId: contextCropId ?? null,
                    createdAt: new Date().toISOString(),
                },
            ]);
        } finally {
            setIsSending(false);
        }
    }, [contextCropId, isSending, prompt, t, threadId]);

    const listData = useMemo(() => [...messages], [messages]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <MessageCircle color={theme.colors.brand[500]} size={20} />
                        <Text style={styles.headerTitle}>{t('chatbot.title')}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            setMessages([]);
                            setThreadId(undefined);
                        }}
                        style={styles.resetButton}
                    >
                        <Text style={styles.resetText}>{t('chatbot.new_chat')}</Text>
                    </TouchableOpacity>
                </View>

                {contextCropName ? (
                    <View style={styles.contextBar}>
                        <Text style={styles.contextText}>{t('chatbot.context_with_crop', { crop: contextCropName })}</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setContextCropId(undefined);
                                setContextCropName(undefined);
                                setThreadId(undefined);
                                setMessages([]);
                            }}
                        >
                            <X color={theme.colors.neutral.subtext} size={16} />
                        </TouchableOpacity>
                    </View>
                ) : null}

                <FlatList
                    data={listData}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>{t('chatbot.empty_title')}</Text>
                            <Text style={styles.emptySubtitle}>{t('chatbot.empty_subtitle')}</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const isUser = item.role === 'user';
                        return (
                            <View style={[styles.bubbleRow, isUser ? styles.rowRight : styles.rowLeft]}>
                                <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
                                    <Text style={[styles.bubbleText, isUser ? styles.userText : styles.botText]}>{item.text}</Text>
                                </View>
                            </View>
                        );
                    }}
                />

                <View style={styles.inputWrap}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('chatbot.input_placeholder')}
                        placeholderTextColor={theme.colors.neutral.subtext}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!prompt.trim() || isSending) && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!prompt.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Send color="#fff" size={16} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.neutral.canvas },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.neutral.border,
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.neutral.dark },
    resetButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: theme.colors.brand[50],
    },
    resetText: { color: theme.colors.brand[600], fontSize: 12, fontWeight: '700' },
    contextBar: {
        marginHorizontal: 16,
        marginTop: 10,
        marginBottom: 2,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.brand[100],
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    contextText: { color: theme.colors.brand[600], fontSize: 12, fontWeight: '600', flex: 1 },
    messagesContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 10, flexGrow: 1 },
    emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.neutral.dark },
    emptySubtitle: { marginTop: 8, textAlign: 'center', color: theme.colors.neutral.subtext, fontSize: 14 },
    bubbleRow: { flexDirection: 'row' },
    rowLeft: { justifyContent: 'flex-start' },
    rowRight: { justifyContent: 'flex-end' },
    bubble: {
        maxWidth: '85%',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    userBubble: { backgroundColor: theme.colors.brand[600], borderBottomRightRadius: 4 },
    botBubble: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderBottomLeftRadius: 4,
    },
    bubbleText: { fontSize: 14, lineHeight: 20 },
    userText: { color: '#fff' },
    botText: { color: theme.colors.neutral.dark },
    inputWrap: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.neutral.border,
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 110,
        borderWidth: 1,
        borderColor: theme.colors.neutral.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: theme.colors.neutral.dark,
        backgroundColor: '#fafafa',
    },
    sendButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.brand[600],
    },
    sendButtonDisabled: { backgroundColor: '#9ca3af' },
});
