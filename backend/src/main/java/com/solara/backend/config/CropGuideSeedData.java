package com.solara.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.entity.CropGuide;
import com.solara.backend.entity.CropGuideTranslation;
import com.solara.backend.repository.CropGuideRepository;
import com.solara.backend.repository.CropGuideTranslationRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class CropGuideSeedData implements CommandLineRunner {

    private final CropGuideRepository cropGuideRepository;
    private final CropGuideTranslationRepository translationRepository;

    @Override
    @Transactional
    public void run(String... args) {
        upsertRice();
        upsertKidneybeans();
        upsertChickpea();
        upsertPigeonpeas();
        upsertMothbeans();
    }

    private void upsertRice() {
        CropGuide guide = upsertBase(
                "Rice", "Pirinç", "Oryza sativa", "Poaceae", "Grass", "Annual",
                20.0, 35.0, 90, "Clay loam", 5.5, 7.0,
                "Medium", "Medium", "High", 20.0, 25.0, 3.0, 7,
                "4-7 t/ha", "https://images.unsplash.com/photo-1536053251218-4eda47f0f9b8?auto=format&fit=crop&w=1200&q=80");

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
    }

    private void upsertKidneybeans() {
        CropGuide guide = upsertBase(
                "Kidneybeans", "Böbrek Fasulyesi", "Phaseolus vulgaris", "Fabaceae", "Bush/Climber", "Annual",
                18.0, 30.0, 95, "Well-drained loam", 6.0, 7.0,
                "Medium", "Medium", "Medium", 12.0, 50.0, 4.0, 8,
                "1.5-2.5 t/ha", "https://images.unsplash.com/photo-1515543904379-3d757afe72e1?auto=format&fit=crop&w=1200&q=80");

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
    }

    private void upsertChickpea() {
        CropGuide guide = upsertBase(
                "Chickpea", "Nohut", "Cicer arietinum", "Fabaceae", "Bush", "Annual",
                15.0, 30.0, 100, "Loam", 6.0, 8.0,
                "Low", "Medium", "Medium", 10.0, 35.0, 5.0, 10,
                "1.2-2.0 t/ha", "https://images.unsplash.com/photo-1596126525138-c5f8c1dca59f?auto=format&fit=crop&w=1200&q=80");

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
    }

    private void upsertPigeonpeas() {
        CropGuide guide = upsertBase(
                "Pigeonpeas", "Güvercin Bezelyesi", "Cajanus cajan", "Fabaceae", "Shrub", "Perennial(usually annual cycle)",
                20.0, 35.0, 130, "Sandy loam", 5.0, 7.0,
                "Low", "Medium", "Medium", 25.0, 75.0, 5.0, 12,
                "1.0-2.2 t/ha", "https://images.unsplash.com/photo-1603048297172-c92544798d5f?auto=format&fit=crop&w=1200&q=80");

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
    }

    private void upsertMothbeans() {
        CropGuide guide = upsertBase(
                "Mothbeans", "Mat Fasulyesi", "Vigna aconitifolia", "Fabaceae", "Creeping", "Annual",
                24.0, 38.0, 85, "Light sandy loam", 6.0, 7.5,
                "Low", "Low", "Medium", 8.0, 30.0, 3.0, 6,
                "0.8-1.5 t/ha", "https://images.unsplash.com/photo-1603048297760-c34af8fe3fd1?auto=format&fit=crop&w=1200&q=80");

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
            String image) {
        CropGuide guide = cropGuideRepository.findByNameIgnoreCase(name).orElse(CropGuide.builder().name(name).build());
        guide.setCommonNames(commonNames);
        guide.setScientificName(scientificName);
        guide.setFamily(family);
        guide.setGrowthHabit(growthHabit);
        guide.setLifespan(lifespan);
        guide.setOptimalTemperatureMin(minTemp);
        guide.setOptimalTemperatureMax(maxTemp);
        guide.setDaysToMaturity(daysToMaturity);
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
}

