import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
    Box, Button, Heading, Input, VStack, Text, Link, HStack, Flex, Icon, SimpleGrid
} from "@chakra-ui/react"
import { Link as RouterLink, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle, ShieldCheck, KeyRound, Lock, Eye, EyeOff, XCircle } from "lucide-react"
import { Sprout } from "lucide-react"
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher"
import api from "../../lib/axios"
import type { VerifyRequestPayload, VerifyConfirmPayload, VerifyResponse, ResetPasswordPayload } from "../../types/auth"
import { keyframes } from "@emotion/react"

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const CODE_LENGTH = 6
const COOLDOWN_SECONDS = 60

export const VerifyEmail = () => {
    const { t } = useTranslation()
    const [searchParams] = useSearchParams()

    const mode = (searchParams.get("mode") === "forgot" ? "forgot" : "verify") as "verify" | "forgot"
    const prefilledEmail = searchParams.get("email") || ""

    // Step state: 1=email, 2=code, 3=reset password (forgot mode only)
    const [step, setStep] = useState<1 | 2 | 3>(prefilledEmail ? 1 : 1)
    const [email, setEmail] = useState(prefilledEmail)

    // Code input state
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""))
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isVerified, setIsVerified] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    // Password reset state (forgot mode)
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

    // Password validation
    const passwordValidations = useMemo(() => ({
        length: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    }), [newPassword])

    const isPasswordValid = Object.values(passwordValidations).every(Boolean)

    // Cooldown timer
    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setInterval(() => {
            setCooldown((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [cooldown])

    // --- Step 1: Request Code ---
    const handleRequestCode = async (e?: React.FormEvent) => {
        e?.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)
        try {
            const payload: VerifyRequestPayload = { email }
            await api.post<VerifyResponse>("/auth/verify/request", payload)
            setSuccess("")
            setStep(2)
            setCooldown(COOLDOWN_SECONDS)
            // Focus first code input after transition
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
        } catch (err) {
            const axiosError = err as { response?: { data?: { message?: string } } };
            const backendMessage = axiosError?.response?.data?.message;
            setError(backendMessage || t("verify.error_request"))
        } finally {
            setIsLoading(false)
        }
    }

    // --- Step 2: Confirm Code ---
    const handleConfirmCode = useCallback(async (code: string) => {
        setError("")
        setSuccess("")
        setIsLoading(true)
        try {
            const payload: VerifyConfirmPayload = { email, code }
            const response = await api.post<VerifyResponse>("/auth/verify/confirm", payload)
            setSuccess(response.data.message || t("verify.verified"))
            if (mode === "forgot") {
                // Move to step 3: reset password form
                setStep(3)
                setError("")
                setSuccess("")
            } else {
                setIsVerified(true)
            }
        } catch {
            setError(t("verify.error_confirm"))
            // Clear code on failure
            setCodeDigits(Array(CODE_LENGTH).fill(""))
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
        } finally {
            setIsLoading(false)
        }
    }, [email, t])

    // Auto-submit when all digits are filled
    useEffect(() => {
        const code = codeDigits.join("")
        if (code.length === CODE_LENGTH && codeDigits.every((d) => d !== "")) {
            handleConfirmCode(code)
        }
    }, [codeDigits, handleConfirmCode])

    // --- Code Input Handlers ---
    const handleDigitChange = (index: number, value: string) => {
        // Allow only single digit
        const digit = value.replace(/\D/g, "").slice(-1)
        const newDigits = [...codeDigits]
        newDigits[index] = digit
        setCodeDigits(newDigits)

        // Auto-focus next input
        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH)
        if (pasted.length > 0) {
            const newDigits = [...codeDigits]
            for (let i = 0; i < pasted.length; i++) {
                newDigits[i] = pasted[i]
            }
            setCodeDigits(newDigits)
            // Focus the next empty or the last
            const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1)
            inputRefs.current[focusIndex]?.focus()
        }
    }

    // Resend handler
    const handleResend = () => {
        if (cooldown > 0) return
        handleRequestCode()
    }

    // isVerified is now a state variable set only by handleConfirmCode on success

    // --- Step 3: Reset Password (forgot mode) ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (newPassword !== confirmNewPassword) {
            setError(t("verify.reset_error_match"))
            return
        }

        if (!isPasswordValid) return

        setIsLoading(true)
        try {
            const payload: ResetPasswordPayload = { email, newPassword }
            await api.post<VerifyResponse>("/auth/verify/reset-password", payload)
            setPasswordResetSuccess(true)
            setSuccess(t("verify.reset_success_message"))
        } catch {
            setError(t("verify.reset_error_failed"))
        } finally {
            setIsLoading(false)
        }
    }

    const RequirementItem = ({ valid, text }: { valid: boolean; text: string }) => (
        <HStack gap={2} color={valid ? "brand.500" : "neutral.subtext"}>
            <Icon asChild size="sm">
                {valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
            </Icon>
            <Text fontSize="xs" fontWeight="medium">{text}</Text>
        </HStack>
    )

    return (
        <Box minH="100vh" display="flex" flexDirection={{ base: "column", md: "row" }} fontFamily="heading">

            {/* LEFT SIDE (BRANDING) */}
            <Box
                flex="1"
                bg="neutral.dark"
                position="relative"
                display="flex"
                alignItems="center"
                justifyContent="center"
                p={{ base: 8, md: 12 }}
                overflow="hidden"
                color="white"
                order={{ base: 2, md: 1 }}
            >
                {/* Background Overlay */}
                <Box
                    position="absolute"
                    inset="0"
                    bgImage="url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1000&auto=format&fit=crop')"
                    backgroundSize="cover"
                    backgroundPosition="center"
                    opacity="0.15"
                />
                <Box
                    position="absolute"
                    inset="0"
                    bgGradient="to-br"
                    gradientFrom="neutral.dark/90"
                    gradientTo="brand.900/70"
                />

                <Box position="relative" zIndex="10" maxW="lg" w="full">
                    <HStack gap={3} mb={8} align="center">
                        <Box p={3} bg="white/10" backdropFilter="blur(12px)" borderRadius="xl" borderWidth="1px" borderColor="white/20">
                            <Icon asChild fontSize="32px" color="brand.50">
                                <Sprout size={32} />
                            </Icon>
                        </Box>
                        <Heading size="3xl" fontWeight="bold" letterSpacing="tight">Solara</Heading>
                    </HStack>

                    <Heading size={{ base: "3xl", md: "4xl" }} fontWeight="medium" lineHeight="tight" mb={6}>
                        {mode === "forgot" ? t("verify.brand_title_forgot") : t("verify.brand_title_verify")}
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize="lg" lineHeight="relaxed" opacity="0.9">
                        {mode === "forgot" ? t("verify.brand_subtitle_forgot") : t("verify.brand_subtitle_verify")}
                    </Text>

                    <VStack mt={12} pt={8} borderTopWidth="1px" borderColor="white/20" gap={4} align="start">
                        <Flex gap={4} align="start">
                            <Box p={2} bg="brand.500/20" borderRadius="lg" color="brand.400" mt={1}>
                                <Icon asChild size="lg"><ShieldCheck size={20} /></Icon>
                            </Box>
                            <Box>
                                <Heading size="md" fontWeight="bold" color="white">{t("verify.feature_1_title")}</Heading>
                                <Text fontSize="sm" color="whiteAlpha.700">{t("verify.feature_1_desc")}</Text>
                            </Box>
                        </Flex>
                        <Flex gap={4} align="start">
                            <Box p={2} bg="brand.500/20" borderRadius="lg" color="brand.400" mt={1}>
                                <Icon asChild size="lg"><KeyRound size={20} /></Icon>
                            </Box>
                            <Box>
                                <Heading size="md" fontWeight="bold" color="white">{t("verify.feature_2_title")}</Heading>
                                <Text fontSize="sm" color="whiteAlpha.700">{t("verify.feature_2_desc")}</Text>
                            </Box>
                        </Flex>
                    </VStack>
                </Box>
            </Box>

            {/* RIGHT SIDE (FORM) */}
            <Box flex="1" bg="white" display="flex" alignItems="center" justifyContent="center" p={8} position="relative" order={{ base: 1, md: 2 }}>
                <Link
                    asChild
                    position="absolute"
                    top={8}
                    left={8}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    color="neutral.subtext"
                    _hover={{ color: "brand.600" }}
                    fontSize="sm"
                    fontWeight="medium"
                >
                    <RouterLink to="/login">
                        <Icon asChild size="md"><ArrowLeft size={18} /></Icon>
                        {t("verify.back_to_login")}
                    </RouterLink>
                </Link>
                <Box position="absolute" top={8} right={8}>
                    <LanguageSwitcher />
                </Box>

                <Box w="full" maxW="md" mt={{ base: 10, md: 0 }}>

                    {/* --- STEP 1: Enter Email --- */}
                    {step === 1 && (
                        <Box animation={`${fadeIn} 0.4s ease-out`}>
                            <Box mb={8}>
                                <Box w={12} h={12} bg="brand.50" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={4} color="brand.600">
                                    <Icon asChild size="xl"><Mail size={24} /></Icon>
                                </Box>
                                <Heading size="2xl" fontWeight="bold" color="neutral.dark">
                                    {mode === "forgot" ? t("verify.title_forgot") : t("verify.title_verify")}
                                </Heading>
                                <Text color="neutral.subtext" mt={2}>
                                    {mode === "forgot" ? t("verify.subtitle_forgot") : t("verify.subtitle_verify")}
                                </Text>
                            </Box>

                            {error && (
                                <Box mb={6} p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl" display="flex" alignItems="center" gap={3} color="red.700" fontSize="sm">
                                    <Icon asChild size="md"><AlertCircle size={18} /></Icon>
                                    {error}
                                </Box>
                            )}

                            <form onSubmit={handleRequestCode}>
                                <VStack gap={5}>
                                    <Box w="full">
                                        <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t("verify.email_label")}</Text>
                                        <Box position="relative">
                                            <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                                                <Mail size={18} />
                                            </Box>
                                            <Input
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                type="email"
                                                required
                                                pl="9"
                                                pr="3"
                                                py="3"
                                                h="auto"
                                                bg="neutral.canvas"
                                                borderColor="neutral.border"
                                                borderRadius="xl"
                                                _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                                                fontSize="sm"
                                                placeholder={t("verify.email_placeholder")}
                                            />
                                        </Box>
                                    </Box>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !email}
                                        bg="brand.600"
                                        color="white"
                                        _hover={{ bg: "brand.700" }}
                                        w="full"
                                        py="3"
                                        h="auto"
                                        borderRadius="xl"
                                        shadow="lg"
                                        shadowColor="brand.200"
                                        fontWeight="bold"
                                        mt={2}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        gap={2}
                                        _disabled={{ opacity: 0.7, cursor: "not-allowed", bg: "neutral.subtext" }}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : t("verify.send_code")}
                                    </Button>
                                </VStack>
                            </form>

                            <Box mt={8} pt={6} borderTopWidth="1px" borderColor="neutral.canvas" textAlign="center" fontSize="sm" color="neutral.subtext">
                                {t("verify.remember_password")}{" "}
                                <Link asChild color="brand.400" fontWeight="bold" _hover={{ color: "brand.300" }}>
                                    <RouterLink to="/login">
                                        {t("verify.login_link")}
                                    </RouterLink>
                                </Link>
                            </Box>
                        </Box>
                    )}

                    {/* --- STEP 2: Enter Code --- */}
                    {step === 2 && !isVerified && (
                        <Box animation={`${fadeIn} 0.4s ease-out`}>
                            <Box mb={8}>
                                <Box w={12} h={12} bg="brand.50" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={4} color="brand.600">
                                    <Icon asChild size="xl"><ShieldCheck size={24} /></Icon>
                                </Box>
                                <Heading size="2xl" fontWeight="bold" color="neutral.dark">
                                    {t("verify.title_code")}
                                </Heading>
                                <Text color="neutral.subtext" mt={2}>
                                    {t("verify.subtitle_code")}{" "}
                                    <Text as="span" fontWeight="bold" color="neutral.dark">{email}</Text>
                                </Text>
                            </Box>

                            {error && (
                                <Box mb={6} p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl" display="flex" alignItems="center" gap={3} color="red.700" fontSize="sm">
                                    <Icon asChild size="md"><AlertCircle size={18} /></Icon>
                                    {error}
                                </Box>
                            )}

                            {/* Code Inputs */}
                            <HStack gap={3} justify="center" mb={8}>
                                {codeDigits.map((digit, index) => (
                                    <Input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el }}
                                        value={digit}
                                        onChange={(e) => handleDigitChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        textAlign="center"
                                        w="56px"
                                        h="64px"
                                        fontSize="2xl"
                                        fontWeight="bold"
                                        bg="neutral.canvas"
                                        borderWidth="2px"
                                        borderColor={digit ? "brand.500" : "neutral.border"}
                                        borderRadius="xl"
                                        color="neutral.dark"
                                        _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 3px var(--chakra-colors-brand-100)", bg: "white" }}
                                        transition="all 0.2s"
                                        disabled={isLoading}
                                    />
                                ))}
                            </HStack>

                            {isLoading && (
                                <Flex justify="center" mb={6}>
                                    <Loader2 className="animate-spin" size={24} color="var(--chakra-colors-brand-500)" />
                                </Flex>
                            )}

                            {/* Resend */}
                            <Box textAlign="center" fontSize="sm" color="neutral.subtext">
                                {t("verify.didnt_receive")}{" "}
                                {cooldown > 0 ? (
                                    <Text as="span" color="neutral.text" fontWeight="medium">
                                        {t("verify.resend_in", { seconds: cooldown })}
                                    </Text>
                                ) : (
                                    <Button
                                        variant="plain"
                                        color="brand.500"
                                        fontWeight="bold"
                                        fontSize="sm"
                                        p={0}
                                        h="auto"
                                        minW="auto"
                                        _hover={{ color: "brand.700", textDecoration: "underline" }}
                                        onClick={handleResend}
                                        disabled={isLoading}
                                    >
                                        {t("verify.resend")}
                                    </Button>
                                )}
                            </Box>

                            {/* Change email */}
                            <Box mt={6} textAlign="center">
                                <Button
                                    variant="plain"
                                    color="neutral.subtext"
                                    fontSize="sm"
                                    fontWeight="medium"
                                    p={0}
                                    h="auto"
                                    minW="auto"
                                    _hover={{ color: "brand.500" }}
                                    onClick={() => { setStep(1); setError(""); setSuccess(""); setIsVerified(false); setCodeDigits(Array(CODE_LENGTH).fill("")) }}
                                >
                                    {t("verify.change_email")}
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {/* --- STEP 3: Reset Password (forgot mode) --- */}
                    {step === 3 && mode === "forgot" && !passwordResetSuccess && (
                        <Box animation={`${fadeIn} 0.4s ease-out`}>
                            <Box mb={8}>
                                <Box w={12} h={12} bg="brand.50" borderRadius="xl" display="flex" alignItems="center" justifyContent="center" mb={4} color="brand.600">
                                    <Icon asChild size="xl"><KeyRound size={24} /></Icon>
                                </Box>
                                <Heading size="2xl" fontWeight="bold" color="neutral.dark">
                                    {t("verify.reset_title")}
                                </Heading>
                                <Text color="neutral.subtext" mt={2}>
                                    {t("verify.reset_subtitle")}
                                </Text>
                            </Box>

                            {error && (
                                <Box mb={6} p={4} bg="red.50" borderWidth="1px" borderColor="red.200" borderRadius="xl" display="flex" alignItems="center" gap={3} color="red.700" fontSize="sm">
                                    <Icon asChild size="md"><AlertCircle size={18} /></Icon>
                                    {error}
                                </Box>
                            )}

                            {/* Password Requirements */}
                            <Box mb={6} p={4} bg="neutral.canvas" borderRadius="xl" borderWidth="1px" borderColor="neutral.border">
                                <Text fontSize="xs" fontWeight="bold" color="neutral.text" mb={2}>{t("verify.password_req_title")}</Text>
                                <SimpleGrid columns={2} gap={2}>
                                    <RequirementItem valid={passwordValidations.length} text={t("verify.password_req_length")} />
                                    <RequirementItem valid={passwordValidations.uppercase} text={t("verify.password_req_uppercase")} />
                                    <RequirementItem valid={passwordValidations.number} text={t("verify.password_req_number")} />
                                    <RequirementItem valid={passwordValidations.special} text={t("verify.password_req_special")} />
                                </SimpleGrid>
                            </Box>

                            <form onSubmit={handleResetPassword}>
                                <VStack gap={5}>
                                    <Box w="full">
                                        <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t("verify.reset_new_password")}</Text>
                                        <Box position="relative">
                                            <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                                                <Lock size={18} />
                                            </Box>
                                            <Input
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                type={showPassword ? "text" : "password"}
                                                required
                                                pl="9"
                                                pr="10"
                                                py="3"
                                                h="auto"
                                                bg="neutral.canvas"
                                                borderColor="neutral.border"
                                                borderRadius="xl"
                                                _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                                                fontSize="sm"
                                                placeholder={t("verify.reset_password_placeholder")}
                                            />
                                            <Box position="absolute" right="3" top="50%" transform="translateY(-50%)" cursor="pointer" color="neutral.subtext" onClick={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box w="full">
                                        <Text mb={2} fontSize="sm" fontWeight="semibold" color="neutral.text">{t("verify.reset_confirm_password")}</Text>
                                        <Box position="relative">
                                            <Box position="absolute" left="3" top="50%" transform="translateY(-50%)" color="neutral.subtext" zIndex="2">
                                                <Lock size={18} />
                                            </Box>
                                            <Input
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                type={showConfirmPassword ? "text" : "password"}
                                                required
                                                pl="9"
                                                pr="10"
                                                py="3"
                                                h="auto"
                                                bg="neutral.canvas"
                                                borderColor="neutral.border"
                                                borderRadius="xl"
                                                _focus={{ borderColor: "brand.500", outline: "none", boxShadow: "0 0 0 2px var(--chakra-colors-brand-500-20)" }}
                                                fontSize="sm"
                                                placeholder={t("verify.reset_password_placeholder")}
                                            />
                                            <Box position="absolute" right="3" top="50%" transform="translateY(-50%)" cursor="pointer" color="neutral.subtext" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Button
                                        type="submit"
                                        disabled={isLoading || !isPasswordValid || !confirmNewPassword}
                                        bg="brand.600"
                                        color="white"
                                        _hover={{ bg: "brand.700" }}
                                        w="full"
                                        py="3"
                                        h="auto"
                                        borderRadius="xl"
                                        shadow="lg"
                                        shadowColor="brand.200"
                                        fontWeight="bold"
                                        mt={2}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        gap={2}
                                        _disabled={{ opacity: 0.7, cursor: "not-allowed", bg: "neutral.subtext" }}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : t("verify.reset_submit")}
                                    </Button>
                                </VStack>
                            </form>
                        </Box>
                    )}

                    {/* --- SUCCESS STATE (verify mode or password reset success) --- */}
                    {(isVerified || passwordResetSuccess) && (
                        <Box animation={`${fadeIn} 0.4s ease-out`} textAlign="center">
                            <Box w={16} h={16} bg="green.50" borderRadius="full" display="flex" alignItems="center" justifyContent="center" mx="auto" mb={6}>
                                <Icon asChild size="xl" color="green.500">
                                    <CheckCircle size={32} />
                                </Icon>
                            </Box>
                            <Heading size="2xl" fontWeight="bold" color="neutral.dark" mb={3}>
                                {passwordResetSuccess ? t("verify.reset_success_title") : t("verify.success_title_verify")}
                            </Heading>
                            <Text color="neutral.subtext" mb={8}>
                                {success}
                            </Text>
                            <Button
                                asChild
                                bg="brand.600"
                                color="white"
                                _hover={{ bg: "brand.700" }}
                                w="full"
                                py="3"
                                h="auto"
                                borderRadius="xl"
                                shadow="lg"
                                shadowColor="brand.200"
                                fontWeight="bold"
                            >
                                <RouterLink to="/login">
                                    {t("verify.go_to_login")}
                                </RouterLink>
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    )
}
