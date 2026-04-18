import { useState, useRef, useEffect } from "react";
import { Box, Button, Flex, Input, Spinner, Text } from "@chakra-ui/react";
import { MessageCircle, X, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { chatService } from "./chat.service";

interface CropChatbotProps {
    cropId: string;
    cropName: string;
}

interface Message {
    id: string;
    role: "user" | "bot";
    text: string;
}

const formatChatText = (text: string) => {
    // Split by **...** matching
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <Text as="span" fontWeight="800" key={index}>
                    {part.slice(2, -2)}
                </Text>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

export const CropChatbot = ({ cropId, cropName }: CropChatbotProps) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [threadId, setThreadId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsgText = input.trim();
        const tempId = crypto.randomUUID();
        
        setMessages((prev) => [...prev, { id: tempId, role: "user", text: userMsgText }]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await chatService.sendMessage({
                prompt: userMsgText,
                cropId,
                threadId,
            });
            
            if (!threadId && response.threadId) {
                setThreadId(response.threadId);
            }
            
            setMessages((prev) => [
                ...prev,
                { id: response.id, role: "bot", text: response.text }
            ]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "bot", text: t("chat.error_msg") }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box position="fixed" bottom={{ base: 4, md: 8 }} right={{ base: 4, md: 8 }} zIndex={1000} w="60px" h="60px">
            {/* Chat Window */}
            <Flex
                position="absolute"
                bottom="0"
                right="0"
                direction="column"
                bg="white"
                w={{ base: "85vw", sm: "350px", md: "400px" }}
                h="500px"
                maxH="80vh"
                borderRadius="2xl"
                boxShadow="2xl"
                overflow="hidden"
                border="1px solid"
                borderColor="neutral.border"
                transformOrigin="bottom right"
                transform={isOpen ? "scale(1)" : "scale(0.5)"}
                opacity={isOpen ? 1 : 0}
                visibility={isOpen ? "visible" : "hidden"}
                pointerEvents={isOpen ? "auto" : "none"}
                transition="all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            >
                {/* Header */}
                <Flex bg="brand.500" color="white" p={4} align="center" justify="space-between">
                    <Flex align="center" gap={2}>
                        <MessageCircle size={20} />
                        <Text fontWeight="semibold">{t("chat.title")}</Text>
                    </Flex>
                    <Button
                        variant="ghost"
                        size="sm"
                        color="white"
                        _hover={{ bg: "whiteAlpha.200" }}
                        onClick={() => setIsOpen(false)}
                        p={0}
                        minW="auto"
                        h="auto"
                    >
                        <X size={20} />
                    </Button>
                </Flex>

                {/* Messages Area */}
                <Flex
                    direction="column"
                    flex="1"
                    p={4}
                    overflowY="auto"
                    bg="gray.50"
                    gap={3}
                >
                    {messages.length === 0 && (
                        <Text color="gray.500" fontSize="sm" textAlign="center" mt={4}>
                            {t("chat.empty_msg", { cropName })}
                        </Text>
                    )}
                    {messages.map((msg) => (
                        <Flex
                            key={msg.id}
                            alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                            maxW="80%"
                        >
                            <Box
                                bg={msg.role === "user" ? "brand.500" : "white"}
                                color={msg.role === "user" ? "white" : "gray.800"}
                                border="1px solid"
                                borderColor={msg.role === "user" ? "brand.500" : "gray.200"}
                                px={4}
                                py={2}
                                borderRadius="2xl"
                                borderBottomRightRadius={msg.role === "user" ? "sm" : "2xl"}
                                borderBottomLeftRadius={msg.role === "bot" ? "sm" : "2xl"}
                            >
                                <Text fontSize="sm" whiteSpace="pre-wrap">{formatChatText(msg.text)}</Text>
                            </Box>
                        </Flex>
                    ))}
                    {isLoading && (
                        <Flex alignSelf="flex-start">
                            <Box bg="white" color="gray.800" border="1px solid" borderColor="gray.200" px={4} py={2} borderRadius="2xl" borderBottomLeftRadius="sm">
                                <Spinner size="sm" color="brand.500" />
                            </Box>
                        </Flex>
                    )}
                    <div ref={messagesEndRef} />
                </Flex>

                {/* Input Area */}
                <Flex p={3} bg="white" borderTop="1px solid" borderColor="gray.200" gap={2} align="center">
                    <Input
                        flex="1"
                        placeholder={t("chat.placeholder")}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                        borderRadius="full"
                        size="md"
                    />
                    <Button
                        borderRadius="full"
                        w="40px"
                        h="40px"
                        p={0}
                        bg="brand.500"
                        color="white"
                        _hover={{ bg: "brand.600" }}
                        onClick={handleSend}
                        disabled={isLoading}
                    >
                        {isLoading ? <Spinner size="sm" /> : <Send size={18} />}
                    </Button>
                </Flex>
            </Flex>

            {/* Floating Action Button */}
            <Button
                position="absolute"
                bottom="0"
                right="0"
                onClick={() => setIsOpen(true)}
                bg="brand.500"
                color="white"
                _hover={{ bg: "brand.600", transform: "scale(1.05)" }}
                _active={{ bg: "brand.700" }}
                w="100%"
                h="100%"
                borderRadius="full"
                boxShadow="xl"
                p={0}
                transform={isOpen ? "scale(0) rotate(90deg)" : "scale(1) rotate(0deg)"}
                opacity={isOpen ? 0 : 1}
                visibility={isOpen ? "hidden" : "visible"}
                pointerEvents={isOpen ? "none" : "auto"}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            >
                <MessageCircle size={28} />
            </Button>
        </Box>
    );
};
