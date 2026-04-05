package com.mybooktimezon.service;

import com.mybooktimezon.web.dto.request.LoginRequest;
import com.mybooktimezon.web.dto.request.RegisterClinicRequest;
import com.mybooktimezon.web.dto.response.AuthResponse;
import com.mybooktimezon.web.dto.response.ProfileResponse;
import com.mybooktimezon.security.SecurityUserPrincipal;

public interface AuthService {

    AuthResponse register(RegisterClinicRequest request);

    AuthResponse login(LoginRequest request);

    ProfileResponse getProfile(SecurityUserPrincipal principal);
}
