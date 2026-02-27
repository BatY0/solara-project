import { Flex, Text, Circle } from "@chakra-ui/react"
import { Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

interface AddNewFieldCardProps {
    onAddClick: () => void
}

export const AddNewFieldCard = ({ onAddClick }: AddNewFieldCardProps) => {
    const { t } = useTranslation()

    return (
        <Flex
            onClick={onAddClick}
            bg="rgba(248, 250, 252, 0.5)"
            border="2px dashed"
            borderColor="neutral.border"
            borderRadius="2xl"
            direction="column"
            align="center"
            justify="center"
            p={8}
            color="neutral.subtext"
            minH="250px"
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ bg: "brand.50", borderColor: "brand.100", color: "brand.500" }}
        >
            <Circle size={16} bg="white" shadow="sm" mb={4} border="1px solid" borderColor="gray.100">
                <Plus size={32} />
            </Circle>
            <Text fontWeight="bold" fontSize="lg" mb={1}>
                {t('dashboard.new_field')}
            </Text>
            <Text fontSize="sm" textAlign="center" color="gray.500">
                {t('dashboard.add_field_desc')}
            </Text>
        </Flex>
    )
}
