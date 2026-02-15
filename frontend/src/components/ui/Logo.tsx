import { HStack, Text, Icon, Box } from "@chakra-ui/react"
import type { ComponentProps } from "react"
import { Sprout } from "lucide-react"

interface LogoProps extends ComponentProps<typeof HStack> {
  iconColor?: string
  iconBg?: string
  textColor?: string
}

export const Logo = ({ iconColor = "brand.500", iconBg = "brand.50", textColor = "neutral.dark", ...props }: LogoProps) => {
  return (
    <HStack gap={3} align="center" {...props}>
      <Box bg={iconBg} p={2} borderRadius="xl">
        <Icon asChild color={iconColor} fontSize="24px">
          <Sprout size={24} />
        </Icon>
      </Box>
      <Text fontSize="2xl" fontWeight="bold" letterSpacing="tight" color={textColor}>
        Solara
      </Text>
    </HStack>
  )
}
