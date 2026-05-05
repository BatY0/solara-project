package com.solara.backend.config;

import java.util.List;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.entity.CropGuide;
import com.solara.backend.entity.CropGuidePestDisease;
import com.solara.backend.entity.CropGuidePostHarvestProfile;
import com.solara.backend.entity.CropGuideTranslation;
import com.solara.backend.repository.CropGuidePestDiseaseRepository;
import com.solara.backend.repository.CropGuidePostHarvestProfileRepository;
import com.solara.backend.repository.CropGuideRepository;
import com.solara.backend.repository.CropGuideTranslationRepository;

import lombok.RequiredArgsConstructor;

@Component
@ConditionalOnProperty(name = "app.seed.crop-guides.enabled", havingValue = "true")
@RequiredArgsConstructor
public class CropGuideSeedData implements CommandLineRunner {

    private final CropGuideRepository cropGuideRepository;
    private final CropGuideTranslationRepository translationRepository;
    private final CropGuidePestDiseaseRepository pestDiseaseRepository;
    private final CropGuidePostHarvestProfileRepository postHarvestRepository;

    @Override
    @Transactional
    public void run(String... args) {
        upsertRice();
        upsertKidneybeans();
        upsertChickpea();
        upsertPigeonpeas();
        upsertMothbeans();
        upsertRemainingGuides();
    }

    private void upsertRice() {
        CropGuide guide = upsertBase(
                "Rice", "Pirinç", "Oryza sativa", "Poaceae", "Grass", "Annual",
                20.0, 35.0, 90,
                "Tropical", "None", 6.0,
                20.0, 35.0, 18.0, 35.0, 22.0, 30.0,
                100.0, "Low", "High",
                "Clay loam", 5.5, 7.0,
                "Medium", "Medium", "High",
                20.0, 25.0, 3.0, 7,
                "4-7 t/ha", "https://t4.ftcdn.net/jpg/04/73/73/37/360_F_473733756_rS9ps9Ko6RcIj2j7G5FVLei4NdL9717r.jpg");

        upsertTranslation(guide, "en",
                "Rice is a warm-season cereal crop mostly cultivated in flooded fields.",
                "Basmati, Jasmine, Arborio",
                "Staple food crop",
                "Puddle soil and level the field for even water distribution.",
                "Direct sowing or transplanting seedlings",
                "Plant after frost risk when temperatures are stable.",
                "Maintain shallow standing water during vegetative stage.",
                "Apply nitrogen in split doses, with phosphorus at planting.",
                "Use pre-emergence control and shallow manual weeding.",
                "Not required for most varieties.",
                "Stem borer, planthopper",
                "Blast, bacterial leaf blight",
                "Use resistant varieties and balanced fertilization.",
                "Panicles turn golden and grains become firm.",
                "Harvest with sickle or combine at physiological maturity.",
                "Dry grain to safe moisture before storage.",
                "Store at low humidity and cool temperature.",
                "6-12 months");

        upsertTranslation(guide, "tr",
                "Pirinç, çoğunlukla su tutulan alanlarda yetiştirilen sıcak sezon tahılıdır.",
                "Basmati, Yasemin, Arborio",
                "Temel gıda ürünü",
                "Toprağı tavlayın ve suyun eşit dağılması için araziyi tesviye edin.",
                "Doğrudan ekim veya fide şaşırtma",
                "Don riski geçtikten sonra sıcaklık oturduğunda ekin.",
                "Vejetatif dönemde sığ su seviyesini koruyun.",
                "Azotu bölerek, fosforu ekimle birlikte verin.",
                "Önleyici yabancı ot kontrolü ve yüzeysel çapalama uygulayın.",
                "Çoğu çeşitte destek gerektirmez.",
                "Sap kurdu, yaprak piresi",
                "Yanıklık, bakteriyel yaprak yanıklığı",
                "Dayanıklı çeşit ve dengeli gübreleme kullanın.",
                "Salkımlar altın sarısı olur, taneler sertleşir.",
                "Fizyolojik olgunlukta orak veya biçerdöverle hasat edin.",
                "Depolama öncesi taneyi güvenli nem düzeyine kadar kurutun.",
                "Düşük nem ve serin ortamda depolayın.",
                "6-12 ay");
        upsertPhase2Rows(guide);
    }

    private void upsertKidneybeans() {
        CropGuide guide = upsertBase(
                "Kidneybeans", "Böbrek Fasulyesi", "Phaseolus vulgaris", "Fabaceae", "Bush/Climber", "Annual",
                18.0, 30.0, 95,
                "Temperate", "Frost Sensitive", 6.0,
                15.0, 30.0, 16.0, 29.0, 18.0, 27.0,
                50.0, "Low", "Low",
                "Well-drained loam", 6.0, 7.0,
                "Medium", "Medium", "Medium",
                12.0, 50.0, 4.0, 8,
                "1.5-2.5 t/ha", "https://cdn.shopify.com/s/files/1/0530/2596/4187/files/Shutterstock_1447247864.jpg?v=1737555387");

        upsertTranslation(guide, "en",
                "Kidneybeans are protein-rich legumes with moderate water demand.",
                "Rajma Red, Light Red, Speckled",
                "Dry beans, canned food, protein source",
                "Incorporate compost and ensure good drainage.",
                "Direct sowing",
                "Plant in warm soil after the last frost.",
                "Water consistently during flowering and pod set.",
                "Apply starter phosphorus and moderate nitrogen.",
                "Mulch and shallow cultivate to suppress weeds.",
                "Provide support for climbing cultivars.",
                "Aphids, bean beetles",
                "Rust, anthracnose",
                "Use crop rotation and clean seed.",
                "Pods dry and rattle, seeds harden.",
                "Harvest dry pods manually or mechanically.",
                "No curing required beyond field drying.",
                "Store in dry, cool containers.",
                "8-12 months");

        upsertTranslation(guide, "tr",
                "Böbrek fasulyesi, orta su ihtiyacına sahip protein zengini baklagildir.",
                "Rajma Red, Light Red, Speckled",
                "Kuru fasulye, konserve, protein kaynağı",
                "Kompost karıştırın ve iyi drenaj sağlayın.",
                "Doğrudan ekim",
                "Son don sonrası ısınmış toprağa ekin.",
                "Çiçeklenme ve bakla bağlama döneminde düzenli sulayın.",
                "Başlangıçta fosfor ve orta düzey azot uygulayın.",
                "Malç ve yüzeysel çapalama ile yabancı otları baskılayın.",
                "Sarmaşık çeşitlerde destek sağlayın.",
                "Yaprak biti, fasulye böceği",
                "Pas, antraknoz",
                "Ekim nöbeti ve temiz tohum kullanın.",
                "Baklalar kurur ve sallanınca ses verir, tohum sertleşir.",
                "Kuru baklaları elle veya makine ile hasat edin.",
                "Tarla kurutması dışında ekstra kürleme gerekmez.",
                "Kuru ve serin kaplarda saklayın.",
                "8-12 ay");
        upsertPhase2Rows(guide);
    }

    private void upsertChickpea() {
        CropGuide guide = upsertBase(
                "Chickpea", "Nohut", "Cicer arietinum", "Fabaceae", "Bush", "Annual",
                15.0, 30.0, 100,
                "Semi-arid", "Moderate", 8.0,
                10.0, 30.0, 15.0, 30.0, 20.0, 29.0,
                40.0, "High", "Low",
                "Loam", 6.0, 8.0,
                "Low", "Medium", "Medium",
                10.0, 35.0, 5.0, 10,
                "1.2-2.0 t/ha", "https://www.bhg.com/thmb/AFG80NSx7Vc0YRX9fTWU9ye9e6Y=/3500x0/filters:no_upscale():strip_icc()/grow-chickpeas-8655370-fea1e109fea143d1a09a862f0cbb17f1.jpg");

        upsertTranslation(guide, "en",
                "Chickpea performs well in cool-to-warm, relatively dry seasons.",
                "Desi, Kabuli",
                "Dry grain, flour, hummus",
                "Prepare fine seedbed and avoid compaction.",
                "Direct sowing",
                "Sow at season start in well-drained fields.",
                "Avoid over-irrigation; critical water at flowering.",
                "Use inoculants and moderate phosphorus.",
                "Control early weeds mechanically or with mulch.",
                "Usually no staking needed.",
                "Pod borer, cutworms",
                "Ascochyta blight, wilt",
                "Use resistant seed and avoid overhead irrigation late season.",
                "Pods turn straw-colored and seeds harden.",
                "Harvest when most pods are dry.",
                "Field dry to safe seed moisture.",
                "Store in airtight dry bins.",
                "10-14 months");

        upsertTranslation(guide, "tr",
                "Nohut, serin-ılıman ve nispeten kuru sezonlarda iyi performans gösterir.",
                "Desi, Kabuli",
                "Kuru tane, un, humus",
                "İnce bir tohum yatağı hazırlayın ve sıkışmayı önleyin.",
                "Doğrudan ekim",
                "Sezon başında iyi drenajlı tarlalara ekin.",
                "Aşırı sulamadan kaçının; kritik sulama çiçeklenmede yapılır.",
                "Aşılayıcı ve orta düzey fosfor kullanın.",
                "Erken dönemde yabancı otları mekanik veya malçla kontrol edin.",
                "Genelde herek gerekmez.",
                "Bakla kurdu, bozkurt",
                "Antraknoz benzeri yanıklık, solgunluk",
                "Dayanıklı tohum kullanın ve sezon sonu üstten sulamadan kaçının.",
                "Baklalar saman rengine döner, tohum sertleşir.",
                "Baklaların çoğu kuruduğunda hasat edin.",
                "Tohum nemini güvenli düzeye indirene kadar tarlada kurutun.",
                "Kuru ve hava geçirmez depolarda saklayın.",
                "10-14 ay");
        upsertPhase2Rows(guide);
    }

    private void upsertPigeonpeas() {
        CropGuide guide = upsertBase(
                "Pigeonpeas", "Güvercin Bezelyesi", "Cajanus cajan", "Fabaceae", "Shrub", "Perennial(usually annual cycle)",
                20.0, 35.0, 130,
                "Tropical/Semi-arid", "Very Sensitive", 6.0,
                18.0, 35.0, 20.0, 35.0, 18.0, 32.0,
                60.0, "High", "Medium",
                "Sandy loam", 5.0, 7.0,
                "Low", "Medium", "Medium",
                25.0, 75.0, 5.0, 12,
                "1.0-2.2 t/ha", "https://sustainableholly.com/wp-content/uploads/2025/06/pigeon-pea-green-pods-edited.jpg");

        upsertTranslation(guide, "en",
                "Pigeonpea is a drought-tolerant pulse crop suited to semi-arid regions.",
                "ICPL lines, local landraces",
                "Pulse grain, fodder, soil improvement",
                "Loosen soil and add organic matter.",
                "Direct sowing",
                "Plant with onset of rainy season.",
                "Needs less frequent but deep irrigation.",
                "Responds to phosphorus and moderate potassium.",
                "Keep rows clean in early establishment.",
                "Light pruning can improve branching in some systems.",
                "Pod fly, pod borer",
                "Wilt, sterility mosaic",
                "Use tolerant varieties and field sanitation.",
                "Pods turn brown and dry.",
                "Pick mature dry pods in batches.",
                "Dry pods thoroughly before threshing.",
                "Store in dry bags away from humidity.",
                "8-10 months");

        upsertTranslation(guide, "tr",
                "Güvercin bezelyesi, yarı kurak bölgeler için uygun kuraklığa dayanıklı bir baklagildir.",
                "ICPL hatları, yerel popülasyonlar",
                "Baklagil tane, yem, toprak iyileştirme",
                "Toprağı gevşetin ve organik madde ekleyin.",
                "Doğrudan ekim",
                "Yağış sezonu başlangıcında ekin.",
                "Daha seyrek ama derin sulama yeterlidir.",
                "Fosfora iyi yanıt verir, orta potasyum ister.",
                "Erken dönemde sıraları yabancı ottan temiz tutun.",
                "Bazı sistemlerde hafif budama dallanmayı artırır.",
                "Bakla sineği, bakla kurdu",
                "Solgunluk, sterilite mozaik",
                "Toleranslı çeşit ve tarla hijyeni uygulayın.",
                "Baklalar kahverengiye döner ve kurur.",
                "Olgun kuru baklaları partiler halinde toplayın.",
                "Harman öncesi baklaları iyi kurutun.",
                "Nemsiz ortamda kuru çuvallarda saklayın.",
                "8-10 ay");
        upsertPhase2Rows(guide);
    }

    private void upsertMothbeans() {
        CropGuide guide = upsertBase(
                "Mothbeans", "Mat Fasulyesi", "Vigna aconitifolia", "Fabaceae", "Creeping", "Annual",
                24.0, 38.0, 85,
                "Arid/Semi-arid", "Very Sensitive", 7.0,
                20.0, 40.0, 22.0, 38.0, 18.0, 35.0,
                30.0, "Very High", "Medium",
                "Light sandy loam", 6.0, 7.5,
                "Low", "Low", "Medium",
                8.0, 30.0, 3.0, 6,
                "0.8-1.5 t/ha", "https://www.feedipedia.org/sites/default/files/images/vigna_aconitifolia_leaves_siddarthmachado.jpg");

        upsertTranslation(guide, "en",
                "Mothbean is a hardy legume adapted to hot and dry climates.",
                "RMO lines, local drought-tolerant strains",
                "Pulse grain, fodder, green manure",
                "Prepare light seedbed with minimal tillage.",
                "Direct sowing",
                "Sow with first effective rains.",
                "Minimal irrigation after establishment.",
                "Low nitrogen demand; moderate phosphorus useful.",
                "Early weed control is critical due to low canopy initially.",
                "No support required.",
                "Thrips, leaf feeders",
                "Leaf spot, root rot",
                "Use seed treatment and avoid water stagnation.",
                "Pods become dry and brittle.",
                "Harvest when majority pods are dry.",
                "Sun-dry plants before threshing.",
                "Store in cool, dry, insect-safe containers.",
                "8-12 months");

        upsertTranslation(guide, "tr",
                "Mat fasulyesi, sıcak ve kurak iklimlere uyumlu dayanıklı bir baklagildir.",
                "RMO hatları, yerel kuraklığa dayanıklı tipler",
                "Baklagil tane, yem, yeşil gübre",
                "Az toprak işleme ile hafif tohum yatağı hazırlayın.",
                "Doğrudan ekim",
                "İlk etkili yağışlarla ekim yapın.",
                "Bitki yerleştikten sonra minimum sulama yeterlidir.",
                "Azot ihtiyacı düşük, orta fosfor faydalıdır.",
                "Başlangıçta bitki örtüsü düşük olduğu için erken yabancı ot kontrolü kritiktir.",
                "Destek gerektirmez.",
                "Trips, yaprak yiyen zararlılar",
                "Yaprak lekesi, kök çürüklüğü",
                "Tohum ilaçlaması yapın ve su birikimini önleyin.",
                "Baklalar kurur ve kırılgan hale gelir.",
                "Baklaların çoğu kuruduğunda hasat edin.",
                "Harman öncesi bitkileri güneşte kurutun.",
                "Serin, kuru ve böceğe karşı güvenli kaplarda saklayın.",
                "8-12 ay");
        upsertPhase2Rows(guide);
    }

    private CropGuide upsertBase(
            String name,
            String commonNames,
            String scientificName,
            String family,
            String growthHabit,
            String lifespan,
            Double minTemp,
            Double maxTemp,
            int daysToMaturity,
            // Climate/environment fields
            String climateHardiness,
            String frostTolerance,
            Double sunlightHours,
            // Temperature stage ranges
            Double germinationTempMin,
            Double germinationTempMax,
            Double growthTempMin,
            Double growthTempMax,
            Double fruitingTempMin,
            Double fruitingTempMax,
            // Water
            Double waterWeeklyMm,
            String droughtTolerance,
            String waterloggingSensitivity,
            // Soil
            String soilType,
            Double phMin,
            Double phMax,
            String nRequirement,
            String pRequirement,
            String kRequirement,
            // Planting
            Double spacingPlantCm,
            Double spacingRowCm,
            Double depthCm,
            Integer germinationDays,
            String expectedYield,
            String image) {

        CropGuide guide = cropGuideRepository.findAllByNameIgnoreCase(name).stream()
                .findFirst()
                .orElse(CropGuide.builder().name(name).build());
        guide.setCommonNames(commonNames);
        guide.setScientificName(scientificName);
        guide.setFamily(family);
        guide.setGrowthHabit(growthHabit);
        guide.setLifespan(lifespan);
        guide.setOptimalTemperatureMin(minTemp);
        guide.setOptimalTemperatureMax(maxTemp);
        guide.setDaysToMaturity(daysToMaturity);
        guide.setClimateHardiness(climateHardiness);
        guide.setFrostTolerance(frostTolerance);
        guide.setSunlightHours(sunlightHours);
        guide.setGerminationTempMin(germinationTempMin);
        guide.setGerminationTempMax(germinationTempMax);
        guide.setGrowthTempMin(growthTempMin);
        guide.setGrowthTempMax(growthTempMax);
        guide.setFruitingTempMin(fruitingTempMin);
        guide.setFruitingTempMax(fruitingTempMax);
        guide.setWaterWeeklyMm(waterWeeklyMm);
        guide.setDroughtTolerance(droughtTolerance);
        guide.setWaterloggingSensitivity(waterloggingSensitivity);
        guide.setSoilType(soilType);
        guide.setPhMin(phMin);
        guide.setPhMax(phMax);
        guide.setNRequirement(nRequirement);
        guide.setPRequirement(pRequirement);
        guide.setKRequirement(kRequirement);
        guide.setSpacingPlantCm(spacingPlantCm);
        guide.setSpacingRowCm(spacingRowCm);
        guide.setDepthCm(depthCm);
        guide.setGerminationDays(germinationDays);
        guide.setExpectedYield(expectedYield);
        guide.setImage(image);
        return cropGuideRepository.save(guide);
    }

    private void upsertTranslation(
            CropGuide guide,
            String languageCode,
            String description,
            String commonVarieties,
            String uses,
            String soilPreparationSteps,
            String plantingMethod,
            String plantingTiming,
            String irrigation,
            String fertilization,
            String weedControl,
            String supportPruning,
            String commonPests,
            String commonDiseases,
            String managementStrategies,
            String signsOfReadiness,
            String harvestingMethod,
            String curing,
            String storageConditions,
            String shelfLife) {
        CropGuideTranslation tr = translationRepository
                .findByCropGuideIdAndLanguageCode(guide.getId(), languageCode)
                .orElse(CropGuideTranslation.builder()
                        .cropGuide(guide)
                        .languageCode(languageCode)
                        .build());

        tr.setDescription(description);
        tr.setCommonVarieties(commonVarieties);
        tr.setUses(uses);
        tr.setSoilPreparationSteps(soilPreparationSteps);
        tr.setPlantingMethod(plantingMethod);
        tr.setPlantingTiming(plantingTiming);
        tr.setIrrigation(irrigation);
        tr.setFertilization(fertilization);
        tr.setWeedControl(weedControl);
        tr.setSupportPruning(supportPruning);
        tr.setCommonPests(commonPests);
        tr.setCommonDiseases(commonDiseases);
        tr.setManagementStrategies(managementStrategies);
        tr.setSignsOfReadiness(signsOfReadiness);
        tr.setHarvestingMethod(harvestingMethod);
        tr.setCuring(curing);
        tr.setStorageConditions(storageConditions);
        tr.setShelfLife(shelfLife);
        translationRepository.save(tr);
    }

    private void upsertPhase2Rows(CropGuide guide) {
        if (pestDiseaseRepository.findByCropGuideIdAndLanguageCode(guide.getId(), "en").isEmpty()) {
            pestDiseaseRepository.save(CropGuidePestDisease.builder()
                    .cropGuide(guide)
                    .languageCode("en")
                    .itemType("PEST")
                    .name("General sap-sucking pests")
                    .severity("Medium")
                    .prevention("Use crop rotation and monitor canopy weekly.")
                    .organicTreatment("Apply neem-based products in early infestation.")
                    .chemicalTreatment("Use registered selective insecticide if threshold is exceeded.")
                    .notes("Adjust intervention by local extension recommendations.")
                    .build());
            pestDiseaseRepository.save(CropGuidePestDisease.builder()
                    .cropGuide(guide)
                    .languageCode("tr")
                    .itemType("PEST")
                    .name("Genel özsuyu emici zararlılar")
                    .severity("Orta")
                    .prevention("Ekim nöbeti uygulayın ve bitki örtüsünü haftalık izleyin.")
                    .organicTreatment("Erken bulaşmada neem bazlı uygulamalar yapın.")
                    .chemicalTreatment("Eşik aşılırsa ruhsatlı seçici insektisit kullanın.")
                    .notes("Yerel teknik tavsiyelere göre müdahale edin.")
                    .build());
        }

        if (postHarvestRepository.findByCropGuideIdAndLanguageCode(guide.getId(), "en").isEmpty()) {
            postHarvestRepository.save(CropGuidePostHarvestProfile.builder()
                    .cropGuide(guide)
                    .languageCode("en")
                    .climateBand("Mediterranean")
                    .curing("Dry produce to safe moisture before long storage.")
                    .storageTemperatureMin(8.0)
                    .storageTemperatureMax(14.0)
                    .storageHumidityMin(55.0)
                    .storageHumidityMax(65.0)
                    .shelfLifeDays(240)
                    .storageNotes("Store in ventilated, dark and clean containers.")
                    .build());
            postHarvestRepository.save(CropGuidePostHarvestProfile.builder()
                    .cropGuide(guide)
                    .languageCode("tr")
                    .climateBand("Akdeniz")
                    .curing("Uzun depolama öncesi ürünü güvenli nem seviyesine düşürün.")
                    .storageTemperatureMin(8.0)
                    .storageTemperatureMax(14.0)
                    .storageHumidityMin(55.0)
                    .storageHumidityMax(65.0)
                    .shelfLifeDays(240)
                    .storageNotes("Havadar, karanlık ve temiz kaplarda depolayın.")
                    .build());
        }
    }

    private void upsertRemainingGuides() {
        List<GuideSeed> seeds = List.of(
                new GuideSeed("Maize", "Mısır", "Zea mays", "Poaceae", "Grass", "Annual",
                        18.0, 34.0, 110,
                        "Temperate/Tropical", "Frost Sensitive", 8.0,
                        10.0, 32.0, 16.0, 34.0, 18.0, 33.0,
                        50.0, "Medium", "Low",
                        "Well-drained loam", 5.8, 7.2,
                        "High", "Medium", "High", 20.0, 70.0, 4.0, 7,
                        "6-10 t/ha", "https://gardenbetty.com/wp-content/uploads/2021/06/corn-vs-maize-01.jpg"),

                new GuideSeed("Mungbean", "Maş fasulyesi", "Vigna radiata", "Fabaceae", "Bush", "Annual",
                        22.0, 35.0, 75,
                        "Tropical", "Very Sensitive", 6.0,
                        18.0, 35.0, 20.0, 34.0, 20.0, 32.0,
                        35.0, "Medium", "Medium",
                        "Sandy loam", 6.0, 7.5,
                        "Low", "Medium", "Medium", 12.0, 40.0, 3.0, 5,
                        "0.9-1.8 t/ha", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQkXnzsmGb4uunAZY5cGoQMnqKdyCUJ6vF1gA&s"),

                new GuideSeed("Blackgram", "Kara maş fasulyesi / Urad", "Vigna mungo", "Fabaceae", "Bush", "Annual",
                        24.0, 36.0, 85,
                        "Tropical", "Very Sensitive", 6.0,
                        20.0, 36.0, 22.0, 35.0, 20.0, 32.0,
                        40.0, "Medium", "Medium",
                        "Loam", 6.0, 7.5,
                        "Low", "Medium", "Medium", 10.0, 35.0, 3.0, 5,
                        "0.8-1.4 t/ha", "https://tiimg.tistatic.com/fp/1/006/615/premium-organic-black-gram-895.jpg"),

                new GuideSeed("Lentil", "Mercimek", "Lens culinaris", "Fabaceae", "Bush", "Annual",
                        12.0, 28.0, 105,
                        "Temperate/Semi-arid", "Moderate", 7.0,
                        7.0, 27.0, 10.0, 28.0, 14.0, 27.0,
                        25.0, "Medium", "Low",
                        "Loam", 6.0, 8.0,
                        "Low", "Medium", "Medium", 10.0, 30.0, 3.0, 8,
                        "1.0-1.8 t/ha", "https://heartbeetfarms.com/wp-content/uploads/2021/01/lentil-harvest-1600x899.jpg"),

                new GuideSeed("Pomegranate", "Nar", "Punica granatum", "Lythraceae", "Shrub", "Perennial",
                        15.0, 35.0, 220,
                        "Mediterranean/Semi-arid", "Moderate", 8.0,
                        12.0, 35.0, 14.0, 35.0, 18.0, 32.0,
                        30.0, "High", "High",
                        "Loam", 5.5, 7.5,
                        "Medium", "Medium", "Medium", 300.0, 500.0, 5.0, 14,
                        "15-25 t/ha", "https://shegrowsveg.com/wp-content/uploads/bis-images/27529/Cover-Pomegranate-_DSF2437-copy-1-scaled-1-536x360-f50_50.jpg"),

                new GuideSeed("Banana", "Muz", "Musa spp.", "Musaceae", "Herbaceous", "Perennial",
                        20.0, 35.0, 300,
                        "Tropical", "Very Sensitive", 8.0,
                        18.0, 35.0, 22.0, 35.0, 20.0, 35.0,
                        100.0, "Low", "High",
                        "Rich loam", 5.5, 7.0,
                        "High", "Medium", "High", 250.0, 300.0, 8.0, 12,
                        "30-60 t/ha", "https://thefinestexotics.co.uk/cdn/shop/files/Apple_Banana.jpg?v=1754235829&width=1946"),

                new GuideSeed("Mango", "Mango", "Mangifera indica", "Anacardiaceae", "Tree", "Perennial",
                        20.0, 35.0, 320,
                        "Tropical/Subtropical", "Sensitive", 8.0,
                        18.0, 35.0, 22.0, 34.0, 22.0, 33.0,
                        50.0, "Medium", "Low",
                        "Sandy loam", 5.5, 7.5,
                        "Medium", "Medium", "High", 800.0, 800.0, 10.0, 14,
                        "8-15 t/ha", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDh6RmUj-ZuZw_77mK_iQzGxg1R46_hVjSxg&s"),

                new GuideSeed("Grapes", "Üzüm", "Vitis vinifera", "Vitaceae", "Climber", "Perennial",
                        15.0, 32.0, 180,
                        "Mediterranean/Temperate", "Moderate", 8.0,
                        10.0, 32.0, 12.0, 30.0, 16.0, 30.0,
                        35.0, "High", "Low",
                        "Well-drained loam", 5.5, 7.2,
                        "Medium", "Medium", "High", 150.0, 250.0, 6.0, 12,
                        "10-25 t/ha", "https://www.seriouseats.com/thmb/XwtcUWlY3TDauWPbBiID1yZ-6Jw=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1289843973-karandaev-hero-ca6df1eb21504ba0965e2319ef4c26e3.jpg"),

                new GuideSeed("Watermelon", "Karpuz", "Citrullus lanatus", "Cucurbitaceae", "Creeping", "Annual",
                        20.0, 35.0, 90,
                        "Hot/Dry", "Very Sensitive", 8.0,
                        18.0, 35.0, 20.0, 35.0, 22.0, 32.0,
                        40.0, "Medium", "Low",
                        "Sandy loam", 6.0, 7.5,
                        "Medium", "Medium", "High", 80.0, 200.0, 3.0, 7,
                        "20-40 t/ha", "https://hips.hearstapps.com/hmg-prod/images/fresh-ripe-watermelon-slices-on-wooden-table-royalty-free-image-1684966820.jpg?crop=0.88973xw:1xh;center,top&resize=1200:*"),

                new GuideSeed("Muskmelon", "Kavun", "Cucumis melo", "Cucurbitaceae", "Creeping", "Annual",
                        20.0, 34.0, 85,
                        "Hot/Dry", "Very Sensitive", 8.0,
                        18.0, 34.0, 20.0, 34.0, 22.0, 32.0,
                        35.0, "Medium", "Low",
                        "Sandy loam", 6.0, 7.5,
                        "Medium", "Medium", "High", 70.0, 180.0, 3.0, 6,
                        "15-25 t/ha", "https://c.ndtvimg.com/2023-05/t1tfkt5_muskmelon_625x300_02_May_23.jpg"),

                new GuideSeed("Apple", "Elma", "Malus domestica", "Rosaceae", "Tree", "Perennial",
                        10.0, 28.0, 220,
                        "Temperate", "High", 7.0,
                        5.0, 28.0, 7.0, 27.0, 14.0, 27.0,
                        40.0, "Low", "Low",
                        "Loam", 5.5, 7.0,
                        "Medium", "Medium", "High", 300.0, 500.0, 8.0, 12,
                        "20-40 t/ha", "https://img.lb.wbmdstatic.com/vim/live/webmd/consumer_assets/site_images/articles/health_tools/healing_foods_slideshow/1800ss_getty_rf_apples.jpg?resize=750px:*&output-quality=75"),

                new GuideSeed("Orange", "Portakal", "Citrus sinensis", "Rutaceae", "Tree", "Perennial",
                        14.0, 32.0, 260,
                        "Subtropical/Mediterranean", "Sensitive", 8.0,
                        12.0, 32.0, 13.0, 32.0, 16.0, 30.0,
                        35.0, "Low", "Medium",
                        "Loam", 6.0, 7.5,
                        "Medium", "Medium", "High", 300.0, 400.0, 7.0, 14,
                        "20-35 t/ha", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWy2deoCitSxEOI52ZF-v5s0YK5B74oDSDIQ&s"),

                new GuideSeed("Papaya", "Papaya", "Carica papaya", "Caricaceae", "Herbaceous", "Perennial",
                        20.0, 35.0, 280,
                        "Tropical", "Very Sensitive", 8.0,
                        18.0, 35.0, 20.0, 35.0, 20.0, 33.0,
                        75.0, "Low", "Low",
                        "Sandy loam", 6.0, 7.0,
                        "High", "Medium", "High", 200.0, 250.0, 5.0, 10,
                        "30-50 t/ha", "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZYT1tOS5o7hV4hje57tDhYLYd-f6WwZdDpg&s"),

                new GuideSeed("Coconut", "Hindistan cevizi", "Cocos nucifera", "Arecaceae", "Tree", "Perennial",
                        24.0, 34.0, 365,
                        "Tropical Coastal", "Very Sensitive", 8.0,
                        20.0, 34.0, 22.0, 34.0, 22.0, 33.0,
                        75.0, "Low", "High",
                        "Sandy loam", 5.0, 8.0,
                        "Medium", "Medium", "High", 700.0, 900.0, 10.0, 20,
                        "8-15 t/ha equivalent", "https://img.lb.wbmdstatic.com/vim/live/webmd/consumer_assets/site_images/article_thumbnails/BigBead/coconut_bigbead/1800x1200_getty_rf_coconut_bigbead.jpg?resize=750px:*&output-quality=75"),

                new GuideSeed("Cotton", "Pamuk", "Gossypium hirsutum", "Malvaceae", "Shrub", "Annual",
                        20.0, 35.0, 170,
                        "Subtropical/Semi-arid", "Frost Sensitive", 8.0,
                        18.0, 35.0, 20.0, 35.0, 20.0, 34.0,
                        55.0, "Medium", "Low",
                        "Well-drained loam", 5.8, 8.0,
                        "High", "Medium", "High", 25.0, 75.0, 4.0, 7,
                        "2-4 t/ha seed cotton", "https://fadfay.com/cdn/shop/articles/cotton-plants-are-tall-and-green-with-a-branching--Xi2ktwlpS02wO48TO6CUsw-sqZ-RNRzS1GLIO91uGXvnA_4e161561-ae25-4e3c-9ffa-f94494a731b2.jpg?v=1772613814&width=1024"),

                new GuideSeed("Jute", "Jüt", "Corchorus olitorius", "Malvaceae", "Herbaceous", "Annual",
                        22.0, 35.0, 130,
                        "Tropical Humid", "Very Sensitive", 7.0,
                        18.0, 35.0, 20.0, 35.0, 20.0, 33.0,
                        90.0, "Low", "High",
                        "Alluvial loam", 6.0, 7.5,
                        "Medium", "Medium", "Medium", 8.0, 25.0, 2.0, 4,
                        "2-3 t/ha fibre", "https://upload.wikimedia.org/wikipedia/commons/9/9e/Jute_Field_Bangladesh_%287749587518%29.jpg"),

                new GuideSeed("Coffee", "Kahve", "Coffea arabica", "Rubiaceae", "Shrub", "Perennial",
                        16.0, 30.0, 300,
                        "Subtropical Highland", "Sensitive", 6.0,
                        14.0, 30.0, 16.0, 28.0, 16.0, 28.0,
                        50.0, "Low", "Low",
                        "Loam", 5.0, 6.5,
                        "Medium", "Medium", "Medium", 200.0, 250.0, 2.0, 30,
                        "0.8-2.0 t/ha green beans", "https://www.aboutcoffee.org/wp-content/uploads/2024/10/ripe-coffee-cherries-on-branch-of-coffee-tree-1024x576.jpg"),

                new GuideSeed("Tomato", "Domates", "Solanum lycopersicum", "Solanaceae", "Bush", "Annual",
                        18.0, 30.0, 95,
                        "Temperate/Warm", "Frost Sensitive", 8.0,
                        10.0, 30.0, 18.0, 30.0, 18.0, 29.0,
                        45.0, "Low", "Medium",
                        "Loam", 6.0, 6.8,
                        "Medium", "Medium", "High", 40.0, 80.0, 1.5, 8,
                        "50-80 t/ha", "https://t0.gstatic.com/licensed-image?q=tbn:ANd9GcQSUQ-WfeFvV7yiIOJskuuflyrJTZV_cszyQcSmvdGeKZmc0oDuhFnPHtQzRinipgdI"));

        for (GuideSeed seed : seeds) {
            CropGuide guide = upsertBase(
                    seed.nameEn,
                    seed.nameTr,
                    seed.scientificName,
                    seed.family,
                    seed.growthHabit,
                    seed.lifespan,
                    seed.minTemp,
                    seed.maxTemp,
                    seed.daysToMaturity,
                    seed.climateHardiness,
                    seed.frostTolerance,
                    seed.sunlightHours,
                    seed.germinationTempMin,
                    seed.germinationTempMax,
                    seed.growthTempMin,
                    seed.growthTempMax,
                    seed.fruitingTempMin,
                    seed.fruitingTempMax,
                    seed.waterWeeklyMm,
                    seed.droughtTolerance,
                    seed.waterloggingSensitivity,
                    seed.soilType,
                    seed.phMin,
                    seed.phMax,
                    seed.nRequirement,
                    seed.pRequirement,
                    seed.kRequirement,
                    seed.spacingPlantCm,
                    seed.spacingRowCm,
                    seed.depthCm,
                    seed.germinationDays,
                    seed.expectedYield,
                    seed.imageUrl);

            upsertTemplateTranslation(guide, "en", seed.nameEn, seed.nameTr);
            upsertTemplateTranslation(guide, "tr", seed.nameEn, seed.nameTr);
            upsertPhase2Rows(guide);
        }
    }

    private void upsertTemplateTranslation(CropGuide guide, String languageCode, String nameEn, String nameTr) {
        boolean tr = "tr".equalsIgnoreCase(languageCode);

        String cropName = tr ? nameTr : nameEn;

        upsertTranslation(
                guide,
                languageCode,
                tr
                        ? cropName + ", mevcut iklim koşullarına uyarlanabilen önemli bir tarımsal üründür."
                        : cropName + " is an important agricultural crop adaptable to local production conditions.",
                tr ? "Yerel çeşitler, geliştirilmiş çeşitler" : "Local varieties, improved cultivars",
                tr ? "Taze tüketim, işleme, pazar ürünü" : "Fresh consumption, processing and market production",
                tr ? "Toprağı işleyin, organik madde ekleyin ve iyi drenaj sağlayın."
                        : "Prepare the seedbed, add organic matter and ensure good drainage.",
                tr ? "Doğrudan ekim veya fide ile üretim" : "Direct sowing or transplanting depending on crop stage",
                tr ? "Bölgesel iklimde uygun sıcaklık döneminde ekim yapın."
                        : "Plant during the suitable seasonal temperature window.",
                tr ? "Bitki gelişim dönemlerine göre düzenli ve kontrollü sulama uygulayın."
                        : "Apply regular and stage-based irrigation management.",
                tr ? "Toprak analizine göre dengeli NPK gübreleme uygulayın."
                        : "Use balanced NPK fertilization according to soil analysis.",
                tr ? "Erken dönemde yabancı ot kontrolünü mekanik ve kültürel yöntemlerle sağlayın."
                        : "Control weeds early with mechanical and cultural practices.",
                tr ? "Gerekli durumlarda destekleme ve budama uygulayın."
                        : "Apply staking/support and pruning where needed.",
                tr ? "Yaprak bitleri, emici zararlılar" : "Aphids, sap-sucking pests",
                tr ? "Yaprak lekeleri, kök çürüklükleri" : "Leaf spots, root rots",
                tr ? "Entegre mücadele, dayanıklı çeşit ve hijyen uygulayın."
                        : "Follow integrated management, resistant varieties and field sanitation.",
                tr ? "Ürün çeşidine göre renk, sertlik ve olgunluk işaretlerini izleyin."
                        : "Track crop-specific color, firmness and maturity indicators.",
                tr ? "Hasat olgunluğunda uygun ekipmanla toplama yapın."
                        : "Harvest at maturity with appropriate tools and handling.",
                tr ? "Uzun depolama öncesi ön kurutma/ön soğutma yapın."
                        : "Apply pre-drying or pre-cooling before longer storage.",
                tr ? "Temiz, serin ve havadar depolama koşulları sağlayın."
                        : "Store in clean, cool and ventilated conditions.",
                tr ? "Ürün tipine göre orta-uzun raf ömrü" : "Medium-to-long shelf life depending on crop type");
    }

    private static class GuideSeed {
        private final String nameEn;
        private final String nameTr;
        private final String scientificName;
        private final String family;
        private final String growthHabit;
        private final String lifespan;
        private final Double minTemp;
        private final Double maxTemp;
        private final int daysToMaturity;
        private final String climateHardiness;
        private final String frostTolerance;
        private final Double sunlightHours;
        private final Double germinationTempMin;
        private final Double germinationTempMax;
        private final Double growthTempMin;
        private final Double growthTempMax;
        private final Double fruitingTempMin;
        private final Double fruitingTempMax;
        private final Double waterWeeklyMm;
        private final String droughtTolerance;
        private final String waterloggingSensitivity;
        private final String soilType;
        private final Double phMin;
        private final Double phMax;
        private final String nRequirement;
        private final String pRequirement;
        private final String kRequirement;
        private final Double spacingPlantCm;
        private final Double spacingRowCm;
        private final Double depthCm;
        private final Integer germinationDays;
        private final String expectedYield;
        private final String imageUrl;

        private GuideSeed(
                String nameEn,
                String nameTr,
                String scientificName,
                String family,
                String growthHabit,
                String lifespan,
                Double minTemp,
                Double maxTemp,
                int daysToMaturity,
                String climateHardiness,
                String frostTolerance,
                Double sunlightHours,
                Double germinationTempMin,
                Double germinationTempMax,
                Double growthTempMin,
                Double growthTempMax,
                Double fruitingTempMin,
                Double fruitingTempMax,
                Double waterWeeklyMm,
                String droughtTolerance,
                String waterloggingSensitivity,
                String soilType,
                Double phMin,
                Double phMax,
                String nRequirement,
                String pRequirement,
                String kRequirement,
                Double spacingPlantCm,
                Double spacingRowCm,
                Double depthCm,
                Integer germinationDays,
                String expectedYield,
                String imageUrl) {
            this.nameEn = nameEn;
            this.nameTr = nameTr;
            this.scientificName = scientificName;
            this.family = family;
            this.growthHabit = growthHabit;
            this.lifespan = lifespan;
            this.minTemp = minTemp;
            this.maxTemp = maxTemp;
            this.daysToMaturity = daysToMaturity;
            this.climateHardiness = climateHardiness;
            this.frostTolerance = frostTolerance;
            this.sunlightHours = sunlightHours;
            this.germinationTempMin = germinationTempMin;
            this.germinationTempMax = germinationTempMax;
            this.growthTempMin = growthTempMin;
            this.growthTempMax = growthTempMax;
            this.fruitingTempMin = fruitingTempMin;
            this.fruitingTempMax = fruitingTempMax;
            this.waterWeeklyMm = waterWeeklyMm;
            this.droughtTolerance = droughtTolerance;
            this.waterloggingSensitivity = waterloggingSensitivity;
            this.soilType = soilType;
            this.phMin = phMin;
            this.phMax = phMax;
            this.nRequirement = nRequirement;
            this.pRequirement = pRequirement;
            this.kRequirement = kRequirement;
            this.spacingPlantCm = spacingPlantCm;
            this.spacingRowCm = spacingRowCm;
            this.depthCm = depthCm;
            this.germinationDays = germinationDays;
            this.expectedYield = expectedYield;
            this.imageUrl = imageUrl;
        }
    }
}
