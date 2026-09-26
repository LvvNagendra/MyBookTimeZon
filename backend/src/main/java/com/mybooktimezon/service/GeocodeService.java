package com.mybooktimezon.service;

import com.mybooktimezon.web.dto.response.GeocodeResultDto;

public interface GeocodeService {

    GeocodeResultDto resolve(String query);
}
