import { Button, Menu, Icon, Portal } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { Globe, ChevronDown } from "lucide-react"

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  const getCurrentLanguage = () => {
    const lang = i18n.language
    if (lang.startsWith('en')) return 'EN'
    if (lang.startsWith('tr')) return 'TR'
    return 'TR'
  }

  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger asChild>
        <Button variant="ghost" size="sm" display="flex" alignItems="center" gap={2}>
          <Icon asChild>
            <Globe size={16} />
          </Icon>
          {getCurrentLanguage()}
          <Icon asChild fontSize="12px">
            <ChevronDown size={12} />
          </Icon>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="120px">
            <Menu.Item value="tr" onClick={() => changeLanguage('tr')}>
              Türkçe
            </Menu.Item>
            <Menu.Item value="en" onClick={() => changeLanguage('en')}>
              English
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
