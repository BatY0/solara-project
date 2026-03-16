package com.solara.backend.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.solara.backend.repository.CropGuideRepository;

import com.solara.backend.entity.CropGuide;
import com.solara.backend.exception.AppException;

@Service
public class CropGuideService {
    private final CropGuideRepository cropRepo;

    public CropGuideService(CropGuideRepository cropRepo) {
        this.cropRepo = cropRepo;
    }

    public Page<CropGuide> getAllPaginated(int page, int size) {
        Pageable pageable = Pageable.ofSize(size).withPage(page);

        return cropRepo.findAll(pageable);
    }

    public List<CropGuide> getAll() {
        return cropRepo.findAll();
    }

    public CropGuide getById(UUID id) {
        return cropRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Crop guide not found with id: " + id));
    }

    @Transactional
    public CropGuide createGuide(CropGuide guide) {
        return cropRepo.save(guide);
    }

    @Transactional
    public CropGuide updateGuide(UUID id, CropGuide guideDetails) {
        CropGuide existingGuide = cropRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Crop guide not found with id: " + id));

        existingGuide.setName(guideDetails.getName());
        existingGuide.setScientificName(guideDetails.getScientificName());
        existingGuide.setOptimalTemperatureMin(guideDetails.getOptimalTemperatureMin());
        existingGuide.setOptimalTemperatureMax(guideDetails.getOptimalTemperatureMax());
        existingGuide.setDaysToMaturity(guideDetails.getDaysToMaturity());
        existingGuide.setDescription(guideDetails.getDescription());
        existingGuide.setPlantingInstructions(guideDetails.getPlantingInstructions());
        existingGuide.setCareInstructions(guideDetails.getCareInstructions());
        existingGuide.setImage(guideDetails.getImage());

        return cropRepo.save(existingGuide);
    }

    @Transactional
    public void deleteGuide(UUID id) {
        CropGuide existingGuide = cropRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Crop guide not found with id: " + id));
        cropRepo.delete(existingGuide);
    }
}
