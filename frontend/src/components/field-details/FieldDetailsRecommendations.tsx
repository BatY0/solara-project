import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { BrainCircuit, Leaf } from "lucide-react";
import type { AnalysisResult } from "../../features/fields/types";

function probBadgeColor(prob: number): 'green' | 'orange' | 'gray' {
    if (prob >= 70) return 'green';
    if (prob >= 40) return 'orange';
    return 'gray';
}

interface FieldDetailsRecommendationsProps {
    lastAnalysis: AnalysisResult | null;
    resultsTitle: string;
    topPickLabel: string;
    reanalyzeLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    analyzeButtonLabel: string;
    noRecommendationsLabel: string;
    scenarioLabel: (scenario: string) => string;
    weatherSourceLabel: (source: string) => string;
    confidenceLabel: (badge: 'green' | 'orange' | 'gray') => string;
    cropLabel: (crop: string) => string;
    scenarioBadgeColor: (scenario: string) => string;
    formatTimestamp: (timestamp: string) => string;
    strongestFactorsLabel: string;
    contributionExplanation: (feature: string, rawValue: number | undefined, score: number) => string;
    onOpenAnalysis: () => void;
    onNavigateGuide: (crop: string) => void;
}

export function FieldDetailsRecommendations({
    lastAnalysis,
    resultsTitle,
    topPickLabel,
    reanalyzeLabel,
    emptyTitle,
    emptyDescription,
    analyzeButtonLabel,
    noRecommendationsLabel,
    scenarioLabel,
    weatherSourceLabel,
    confidenceLabel,
    cropLabel,
    scenarioBadgeColor,
    formatTimestamp,
    strongestFactorsLabel,
    contributionExplanation,
    onOpenAnalysis,
    onNavigateGuide,
}: FieldDetailsRecommendationsProps) {
    if (!lastAnalysis) {
        return (
            <Box p={6} bg="gray.50" borderRadius="2xl" border="1px dashed" borderColor="gray.300" textAlign="center">
                <Flex justify="center" mb={3}><Flex bg="green.50" p={3} borderRadius="xl"><BrainCircuit size={28} color="#059669" /></Flex></Flex>
                <Text fontWeight="semibold" mb={1}>{emptyTitle}</Text>
                <Text fontSize="sm" color="gray.500" mb={4}>{emptyDescription}</Text>
                <Button colorPalette="brand" size="sm" onClick={onOpenAnalysis}><BrainCircuit size={15} />{analyzeButtonLabel}</Button>
            </Box>
        );
    }

    return (
        <Box bg="white" p={{ base: 4, md: 6 }} borderRadius="2xl" border="1px solid" borderColor="gray.200" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <Flex align="center" justify="space-between" mb={4} direction={{ base: "column", md: "row" }} gap={3}>
                <Flex align="center" gap={3} wrap="wrap">
                    <Flex bg="green.50" p={2} borderRadius="lg"><BrainCircuit size={20} color="#059669" /></Flex>
                    <Box>
                        <Text fontSize="lg" fontWeight="semibold">{resultsTitle}</Text>
                        <Text fontSize="xs" color="gray.500">{formatTimestamp(lastAnalysis.timestamp)}</Text>
                    </Box>
                    <Flex px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold" color="white" bg={scenarioBadgeColor(lastAnalysis.scenario)}>
                        {scenarioLabel(lastAnalysis.scenario)}
                    </Flex>
                </Flex>
                <Button size="xs" variant="outline" colorPalette="brand" onClick={onOpenAnalysis} title={reanalyzeLabel} w={{ base: "full", md: "auto" }}>{reanalyzeLabel}</Button>
            </Flex>
            <Box p={3} mb={4} bg="green.50" border="1px solid" borderColor="green.100" borderRadius="lg">
                <Text fontSize="sm" color="green.800">{weatherSourceLabel(lastAnalysis.weatherSource)}</Text>
            </Box>
            {lastAnalysis.recommendations.length === 0 ? (
                <Box p={6} bg="gray.50" borderRadius="xl" textAlign="center"><Text color="gray.500" fontSize="sm">{noRecommendationsLabel}</Text></Box>
            ) : (
                <Flex gap={4} direction="column">
                    {lastAnalysis.recommendations.map((rec, idx) => {
                        const badge = probBadgeColor(rec.probability);
                        const barColor = badge === 'green' ? '#38a169' : badge === 'orange' ? '#dd6b20' : '#a0aec0';
                        return (
                            <Box key={rec.crop} p={4} bg={idx === 0 ? 'green.50' : 'gray.50'} borderRadius="xl" border="1px solid" borderColor={idx === 0 ? 'green.200' : 'gray.200'}>
                                <Flex align="flex-start" justify="space-between" direction={{ base: "column", sm: "row" }} gap={2} mb={2}>
                                    <Flex align="center" gap={2} wrap="wrap">
                                        <Leaf size={16} color={idx === 0 ? '#059669' : '#718096'} />
                                        <Text as="button" title={cropLabel(rec.crop)} fontWeight="semibold" fontSize="md" textTransform="capitalize" cursor="pointer" _hover={{ textDecoration: "underline", color: "brand.700" }} onClick={() => onNavigateGuide(rec.crop)}>
                                            {cropLabel(rec.crop)}
                                        </Text>
                                        {idx === 0 && <Flex px={2} py={0.5} borderRadius="full" fontSize="10px" fontWeight="bold" bg="green.500" color="white">{topPickLabel}</Flex>}
                                    </Flex>
                                    <Flex align="center" gap={2} alignSelf={{ base: "flex-start", sm: "center" }}>
                                        <Flex px={2} py={0.5} borderRadius="full" fontSize="xs" fontWeight="bold" bg={`${badge}.100`} color={`${badge}.800`}>{confidenceLabel(badge)}</Flex>
                                        <Text fontWeight="bold" fontSize="md" style={{ color: barColor }}>{rec.probability.toFixed(1)}%</Text>
                                    </Flex>
                                </Flex>
                                <Box bg="gray.200" borderRadius="full" h="6px" overflow="hidden">
                                    <Box h="100%" borderRadius="full" bg={barColor} style={{ width: `${Math.min(rec.probability, 100).toFixed(1)}%`, transition: 'width 0.6s ease' }} />
                                </Box>
                                {rec.contributions && rec.contributions.length > 0 && (
                                    <Box mt={3} p={3} borderRadius="md" bg="white" border="1px solid" borderColor="gray.200">
                                        <Text fontSize="xs" color="gray.600" fontWeight="semibold" mb={1}>{strongestFactorsLabel}</Text>
                                        <Flex gap={2} direction="column">
                                            {rec.contributions.map((item) => (
                                                <Text key={`${rec.crop}-${item.feature}`} fontSize="xs" color="gray.700" lineHeight="1.35">
                                                    {contributionExplanation(item.feature, item.raw_value, item.score)}
                                                </Text>
                                            ))}
                                        </Flex>
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Flex>
            )}
        </Box>
    );
}

