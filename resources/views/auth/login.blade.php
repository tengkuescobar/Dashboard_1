<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>Login - Dashboard Analytics</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:300,400,500,600,700,800&display=swap" rel="stylesheet" />
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
            --bg-primary: #060918;
            --bg-secondary: #0c1229;
            --card-bg: rgba(15, 23, 50, 0.65);
            --card-border: rgba(99, 128, 255, 0.12);
            --accent-1: #6366f1;
            --accent-2: #818cf8;
            --accent-3: #3b82f6;
            --accent-4: #06b6d4;
            --accent-5: #8b5cf6;
            --text-primary: #f1f5f9;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --input-bg: rgba(15, 23, 42, 0.7);
            --input-border: rgba(99, 128, 255, 0.15);
            --input-focus: rgba(99, 102, 241, 0.4);
            --error-bg: rgba(239, 68, 68, 0.08);
            --error-border: rgba(239, 68, 68, 0.2);
            --error-text: #fca5a5;
        }

        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            background: var(--bg-primary);
            color: var(--text-primary);
            overflow: hidden;
        }

        /* ===== LAYOUT ===== */
        .login-wrapper {
            display: flex;
            min-height: 100vh;
        }

        /* ===== LEFT PANEL — Showcase ===== */
        .showcase-panel {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: linear-gradient(160deg, #060918 0%, #0c1a3a 40%, #0f1847 70%, #0c1229 100%);
        }

        @media (max-width: 968px) {
            .showcase-panel { display: none; }
        }

        /* Animated mesh gradient background */
        .mesh-gradient {
            position: absolute;
            inset: 0;
            overflow: hidden;
        }
        .mesh-gradient .orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.35;
            animation: orbFloat 20s ease-in-out infinite;
        }
        .mesh-gradient .orb-1 {
            width: 500px; height: 500px;
            background: radial-gradient(circle, #6366f1, transparent 70%);
            top: -10%; left: -5%;
            animation-delay: 0s;
        }
        .mesh-gradient .orb-2 {
            width: 400px; height: 400px;
            background: radial-gradient(circle, #3b82f6, transparent 70%);
            bottom: -10%; right: -5%;
            animation-delay: -7s;
        }
        .mesh-gradient .orb-3 {
            width: 350px; height: 350px;
            background: radial-gradient(circle, #06b6d4, transparent 70%);
            top: 40%; left: 50%;
            animation-delay: -14s;
        }

        @keyframes orbFloat {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(40px, -30px) scale(1.05); }
            50% { transform: translate(-20px, 40px) scale(0.95); }
            75% { transform: translate(30px, 20px) scale(1.02); }
        }

        /* Grid pattern overlay */
        .grid-pattern {
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
            background-size: 60px 60px;
            mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        /* Floating particles */
        .particles {
            position: absolute;
            inset: 0;
            overflow: hidden;
        }
        .particle {
            position: absolute;
            width: 3px; height: 3px;
            background: rgba(99, 102, 241, 0.5);
            border-radius: 50%;
            animation: particleRise linear infinite;
        }
        .particle:nth-child(1) { left: 10%; animation-duration: 12s; animation-delay: 0s; width: 2px; height: 2px; }
        .particle:nth-child(2) { left: 25%; animation-duration: 18s; animation-delay: -3s; }
        .particle:nth-child(3) { left: 40%; animation-duration: 15s; animation-delay: -6s; width: 4px; height: 4px; background: rgba(59, 130, 246, 0.4); }
        .particle:nth-child(4) { left: 55%; animation-duration: 20s; animation-delay: -9s; width: 2px; height: 2px; }
        .particle:nth-child(5) { left: 70%; animation-duration: 14s; animation-delay: -2s; background: rgba(6, 182, 212, 0.4); }
        .particle:nth-child(6) { left: 85%; animation-duration: 16s; animation-delay: -5s; width: 2px; height: 2px; }
        .particle:nth-child(7) { left: 15%; animation-duration: 22s; animation-delay: -11s; background: rgba(139, 92, 246, 0.4); }
        .particle:nth-child(8) { left: 60%; animation-duration: 17s; animation-delay: -8s; width: 4px; height: 4px; }

        @keyframes particleRise {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-10vh) scale(1); opacity: 0; }
        }

        /* Showcase content */
        .showcase-content {
            position: relative;
            z-index: 2;
            text-align: center;
            padding: 40px;
            max-width: 520px;
        }

        /* Mini dashboard illustration */
        .dashboard-illustration {
            margin-bottom: 48px;
            position: relative;
        }
        .dash-mock {
            background: rgba(15, 23, 50, 0.6);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(99, 128, 255, 0.12);
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.5);
            animation: dashFloat 6s ease-in-out infinite;
        }

        @keyframes dashFloat {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .dash-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
        }
        .dash-dot { width: 8px; height: 8px; border-radius: 50%; }
        .dash-dot-r { background: #ef4444; }
        .dash-dot-y { background: #eab308; }
        .dash-dot-g { background: #22c55e; }
        .dash-header-bar {
            flex: 1; height: 8px;
            background: rgba(99, 128, 255, 0.08);
            border-radius: 4px;
            margin-left: 8px;
        }

        .dash-kpis {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 16px;
        }
        .dash-kpi {
            background: rgba(99, 102, 241, 0.06);
            border: 1px solid rgba(99, 128, 255, 0.08);
            border-radius: 10px;
            padding: 14px 10px;
            text-align: left;
        }
        .dash-kpi-label {
            font-size: 9px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 6px;
        }
        .dash-kpi-value {
            font-size: 18px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--accent-2), var(--accent-4));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .dash-kpi-change {
            font-size: 9px;
            color: #22c55e;
            margin-top: 4px;
        }
        .dash-kpi-change.neg { color: #ef4444; }

        /* Mini chart bars */
        .dash-chart {
            display: flex;
            align-items: flex-end;
            gap: 6px;
            height: 80px;
            padding: 12px 0;
        }
        .dash-bar {
            flex: 1;
            border-radius: 4px 4px 0 0;
            animation: barGrow 2s ease-out forwards;
            transform-origin: bottom;
            opacity: 0;
        }
        @keyframes barGrow {
            0% { transform: scaleY(0); opacity: 0; }
            100% { transform: scaleY(1); opacity: 1; }
        }
        .dash-bar:nth-child(1) { height: 45%; background: linear-gradient(to top, var(--accent-1), var(--accent-2)); animation-delay: 0.1s; }
        .dash-bar:nth-child(2) { height: 65%; background: linear-gradient(to top, var(--accent-3), var(--accent-4)); animation-delay: 0.2s; }
        .dash-bar:nth-child(3) { height: 40%; background: linear-gradient(to top, var(--accent-5), var(--accent-2)); animation-delay: 0.3s; }
        .dash-bar:nth-child(4) { height: 80%; background: linear-gradient(to top, var(--accent-1), var(--accent-3)); animation-delay: 0.4s; }
        .dash-bar:nth-child(5) { height: 55%; background: linear-gradient(to top, var(--accent-4), var(--accent-2)); animation-delay: 0.5s; }
        .dash-bar:nth-child(6) { height: 90%; background: linear-gradient(to top, var(--accent-3), var(--accent-1)); animation-delay: 0.6s; }
        .dash-bar:nth-child(7) { height: 60%; background: linear-gradient(to top, var(--accent-5), var(--accent-4)); animation-delay: 0.7s; }
        .dash-bar:nth-child(8) { height: 75%; background: linear-gradient(to top, var(--accent-1), var(--accent-4)); animation-delay: 0.8s; }

        /* Line chart overlay */
        .dash-line-chart {
            position: relative;
            height: 60px;
            margin-top: 8px;
        }
        .dash-line-chart svg {
            width: 100%;
            height: 100%;
        }

        .showcase-title {
            font-size: 28px;
            font-weight: 800;
            letter-spacing: -0.03em;
            line-height: 1.2;
            margin-bottom: 12px;
            background: linear-gradient(135deg, #fff 0%, #c7d2fe 50%, var(--accent-4) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .showcase-desc {
            font-size: 15px;
            color: var(--text-secondary);
            line-height: 1.6;
            max-width: 400px;
            margin: 0 auto;
        }

        /* Feature pills */
        .feature-pills {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 28px;
        }
        .feature-pill {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            background: rgba(99, 102, 241, 0.08);
            border: 1px solid rgba(99, 128, 255, 0.1);
            border-radius: 100px;
            font-size: 12px;
            color: var(--text-secondary);
            transition: all 0.3s ease;
        }
        .feature-pill:hover {
            background: rgba(99, 102, 241, 0.15);
            border-color: rgba(99, 128, 255, 0.25);
            color: var(--text-primary);
        }
        .pill-dot {
            width: 6px; height: 6px;
            border-radius: 50%;
            background: var(--accent-1);
        }
        .feature-pill:nth-child(2) .pill-dot { background: var(--accent-4); }
        .feature-pill:nth-child(3) .pill-dot { background: var(--accent-5); }

        /* ===== RIGHT PANEL — Login Form ===== */
        .login-panel {
            width: 480px;
            min-width: 480px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            background: var(--bg-secondary);
            border-left: 1px solid rgba(99, 128, 255, 0.06);
        }

        @media (max-width: 968px) {
            .login-panel {
                width: 100%;
                min-width: unset;
                background: var(--bg-primary);
                border-left: none;
            }
        }

        .login-panel::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 1px;
            height: 100%;
            background: linear-gradient(to bottom, transparent, var(--accent-1), var(--accent-4), transparent);
            opacity: 0.3;
        }

        @media (max-width: 968px) {
            .login-panel::before { display: none; }
        }

        .login-container {
            width: 100%;
            max-width: 380px;
            padding: 40px 32px;
            animation: fadeSlideIn 0.8s ease-out;
        }

        @keyframes fadeSlideIn {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
        }

        /* Logo section */
        .logo-section {
            text-align: center;
            margin-bottom: 40px;
        }
        .logo-icon-wrapper {
            position: relative;
            display: inline-block;
            margin-bottom: 20px;
        }
        .logo-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
                0 12px 32px -6px rgba(99, 102, 241, 0.45),
                0 0 0 1px rgba(99, 102, 241, 0.1);
            position: relative;
            z-index: 1;
        }
        .logo-icon svg { width: 30px; height: 30px; color: white; }
        .logo-glow {
            position: absolute;
            inset: -8px;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
            border-radius: 22px;
            filter: blur(20px);
            opacity: 0.25;
            animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.05); }
        }

        .logo-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: -0.03em;
        }
        .logo-subtitle {
            font-size: 14px;
            color: var(--text-muted);
            margin-top: 8px;
            font-weight: 400;
        }

        /* Divider */
        .divider {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 28px;
        }
        .divider-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--card-border), transparent);
        }
        .divider-text {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 500;
        }

        /* Form styles */
        .form-group {
            margin-bottom: 22px;
            position: relative;
        }
        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: 8px;
            letter-spacing: 0.01em;
        }
        .input-wrapper {
            position: relative;
        }
        .input-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            transition: color 0.3s ease;
            pointer-events: none;
        }
        .input-icon svg { width: 18px; height: 18px; }

        .form-input {
            width: 100%;
            padding: 13px 16px 13px 44px;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            border-radius: 12px;
            font-size: 14px;
            color: var(--text-primary);
            outline: none;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
        }
        .form-input:focus {
            border-color: var(--accent-1);
            box-shadow: 0 0 0 3px var(--input-focus), 0 4px 16px -4px rgba(99, 102, 241, 0.2);
            background: rgba(15, 23, 42, 0.9);
        }
        .form-input:focus + .input-icon,
        .form-input:focus ~ .input-icon { color: var(--accent-2); }
        .form-input::placeholder { color: var(--text-muted); font-weight: 400; }

        /* Password toggle */
        .password-toggle {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            transition: color 0.2s ease;
        }
        .password-toggle:hover { color: var(--text-secondary); }
        .password-toggle svg { width: 18px; height: 18px; }

        /* Remember & Forgot */
        .form-options {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 28px;
        }
        .remember-label {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            font-size: 13px;
            color: var(--text-secondary);
            transition: color 0.2s;
        }
        .remember-label:hover { color: var(--text-primary); }

        .custom-checkbox {
            width: 18px; height: 18px;
            border: 1.5px solid var(--input-border);
            border-radius: 5px;
            background: var(--input-bg);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }
        .custom-checkbox svg { width: 12px; height: 12px; color: white; opacity: 0; transition: opacity 0.2s; }
        .remember-input { display: none; }
        .remember-input:checked + .custom-checkbox {
            background: var(--accent-1);
            border-color: var(--accent-1);
            box-shadow: 0 2px 8px -2px rgba(99, 102, 241, 0.4);
        }
        .remember-input:checked + .custom-checkbox svg { opacity: 1; }

        /* Submit button */
        .submit-btn {
            width: 100%;
            padding: 14px 24px;
            background: linear-gradient(135deg, var(--accent-1), var(--accent-3));
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            letter-spacing: 0.01em;
            position: relative;
            overflow: hidden;
        }
        .submit-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
            opacity: 0;
            transition: opacity 0.3s;
        }
        .submit-btn:hover {
            box-shadow: 0 12px 32px -6px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.1);
            transform: translateY(-2px);
        }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:active { transform: translateY(0); }

        .btn-content {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        .btn-arrow {
            transition: transform 0.3s ease;
        }
        .submit-btn:hover .btn-arrow { transform: translateX(4px); }

        /* Error */
        .error-msg {
            background: var(--error-bg);
            border: 1px solid var(--error-border);
            border-radius: 12px;
            padding: 14px 16px;
            margin-bottom: 24px;
            font-size: 13px;
            color: var(--error-text);
            display: flex;
            align-items: flex-start;
            gap: 10px;
            animation: shake 0.4s ease;
        }
        .error-icon { flex-shrink: 0; margin-top: 1px; }
        .error-icon svg { width: 16px; height: 16px; color: #ef4444; }

        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(6px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(4px); }
        }

        /* Footer text */
        .login-footer {
            text-align: center;
            margin-top: 32px;
            font-size: 12px;
            color: var(--text-muted);
        }
        .login-footer a {
            color: var(--accent-2);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
        }
        .login-footer a:hover { color: var(--accent-4); }

        /* Mobile background */
        @media (max-width: 968px) {
            .mobile-bg-orbs {
                position: fixed;
                inset: 0;
                pointer-events: none;
                z-index: 0;
                overflow: hidden;
            }
            .mobile-bg-orbs .orb {
                position: absolute;
                border-radius: 50%;
                filter: blur(80px);
                opacity: 0.2;
            }
            .mobile-bg-orbs .orb-1 {
                width: 300px; height: 300px;
                background: var(--accent-1);
                top: -80px; right: -60px;
            }
            .mobile-bg-orbs .orb-2 {
                width: 250px; height: 250px;
                background: var(--accent-4);
                bottom: -60px; left: -60px;
            }
            .login-container { position: relative; z-index: 1; }
        }

        /* Smooth scrollbar for mobile */
        @media (max-width: 968px) {
            body { overflow: auto; }
            .login-panel {
                min-height: 100vh;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <!-- LEFT — Showcase Panel -->
        <div class="showcase-panel">
            <div class="mesh-gradient">
                <div class="orb orb-1"></div>
                <div class="orb orb-2"></div>
                <div class="orb orb-3"></div>
            </div>
            <div class="grid-pattern"></div>
            <div class="particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
            </div>

            <div class="showcase-content">
                <!-- Mini Dashboard Illustration -->
                <div class="dashboard-illustration">
                    <div class="dash-mock">
                        <div class="dash-header">
                            <span class="dash-dot dash-dot-r"></span>
                            <span class="dash-dot dash-dot-y"></span>
                            <span class="dash-dot dash-dot-g"></span>
                            <div class="dash-header-bar"></div>
                        </div>
                        <div class="dash-kpis">
                            <div class="dash-kpi">
                                <div class="dash-kpi-label">Revenue</div>
                                <div class="dash-kpi-value">24.8B</div>
                                <div class="dash-kpi-change">↑ 12.5%</div>
                            </div>
                            <div class="dash-kpi">
                                <div class="dash-kpi-label">Subscribers</div>
                                <div class="dash-kpi-value">1.2M</div>
                                <div class="dash-kpi-change">↑ 8.3%</div>
                            </div>
                            <div class="dash-kpi">
                                <div class="dash-kpi-label">Churn Rate</div>
                                <div class="dash-kpi-value">2.1%</div>
                                <div class="dash-kpi-change neg">↓ 0.4%</div>
                            </div>
                        </div>
                        <div class="dash-chart">
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                            <div class="dash-bar"></div>
                        </div>
                        <div class="dash-line-chart">
                            <svg viewBox="0 0 400 60" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stop-color="#6366f1"/>
                                        <stop offset="50%" stop-color="#3b82f6"/>
                                        <stop offset="100%" stop-color="#06b6d4"/>
                                    </linearGradient>
                                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3"/>
                                        <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
                                    </linearGradient>
                                </defs>
                                <path d="M0,45 C30,40 60,25 100,30 C140,35 170,15 200,20 C230,25 260,10 300,15 C340,20 370,8 400,12 L400,60 L0,60 Z"
                                      fill="url(#areaGrad)" opacity="0.5"/>
                                <path d="M0,45 C30,40 60,25 100,30 C140,35 170,15 200,20 C230,25 260,10 300,15 C340,20 370,8 400,12"
                                      fill="none" stroke="url(#lineGrad)" stroke-width="2.5" stroke-linecap="round"/>
                            </svg>
                        </div>
                    </div>
                </div>

                <h2 class="showcase-title">Actionable Insights,<br>Real-Time Analytics</h2>
                <p class="showcase-desc">Monitor KPIs, track revenue trends, and uncover growth opportunities — all in one powerful dashboard.</p>

                <div class="feature-pills">
                    <span class="feature-pill"><span class="pill-dot"></span> Real-time Data</span>
                    <span class="feature-pill"><span class="pill-dot"></span> Revenue Analytics</span>
                    <span class="feature-pill"><span class="pill-dot"></span> Smart Reports</span>
                </div>
            </div>
        </div>

        <!-- RIGHT — Login Form Panel -->
        <div class="login-panel">
            <!-- Mobile background orbs -->
            <div class="mobile-bg-orbs">
                <div class="orb orb-1"></div>
                <div class="orb orb-2"></div>
            </div>

            <div class="login-container">
                <div class="logo-section">
                    <div class="logo-icon-wrapper">
                        <div class="logo-glow"></div>
                        <div class="logo-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                            </svg>
                        </div>
                    </div>
                    <h1 class="logo-title">Dashboard Analytics</h1>
                    <p class="logo-subtitle">Sign in to your account</p>
                </div>

                <div class="divider">
                    <div class="divider-line"></div>
                    <span class="divider-text">Login with email</span>
                    <div class="divider-line"></div>
                </div>

                @if ($errors->any())
                    <div class="error-msg">
                        <span class="error-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                            </svg>
                        </span>
                        <div>
                            @foreach ($errors->all() as $error)
                                <div>{{ $error }}</div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <form method="POST" action="{{ route('login') }}">
                    @csrf
                    <div class="form-group">
                        <label class="form-label" for="email">Email Address</label>
                        <div class="input-wrapper">
                            <input class="form-input" id="email" type="email" name="email"
                                   value="{{ old('email') }}" placeholder="you@company.com" required autofocus>
                            <span class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <div class="input-wrapper">
                            <input class="form-input" id="password" type="password" name="password"
                                   placeholder="••••••••" required>
                            <span class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </span>
                            <button type="button" class="password-toggle" onclick="togglePassword()" id="passToggle">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" id="eyeIcon">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div class="form-options">
                        <label class="remember-label">
                            <input type="checkbox" name="remember" class="remember-input" id="remember">
                            <span class="custom-checkbox">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                            </span>
                            Remember me
                        </label>
                    </div>

                    <button type="submit" class="submit-btn" id="submitBtn">
                        <span class="btn-content">
                            Sign In
                            <svg class="btn-arrow" width="18" height="18" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </span>
                    </button>
                </form>

                <div class="login-footer">
                    <p>Telkom Dashboard Analytics &copy; {{ date('Y') }}</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        function togglePassword() {
            const input = document.getElementById('password');
            const icon = document.getElementById('eyeIcon');
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />';
            } else {
                input.type = 'password';
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />';
            }
        }
    </script>
</body>
</html>
