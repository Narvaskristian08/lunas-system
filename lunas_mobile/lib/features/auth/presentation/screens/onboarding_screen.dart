import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/features/auth/presentation/widgets/auth_layout.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _currentPage = 0;

  static const _pages = [
    (
      icon: Icons.add_location_alt_outlined,
      title: 'Report issues that matter',
      description:
          'Send verified reports with photos and location details directly to your local government.',
    ),
    (
      icon: Icons.track_changes_rounded,
      title: 'Track every update',
      description:
          'Follow your report from validation and assignment through repair and resolution.',
    ),
    (
      icon: Icons.groups_2_outlined,
      title: 'Build a safer community',
      description:
          'Help residents and city teams work together for cleaner, safer, more responsive streets.',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _continue() {
    if (_currentPage == _pages.length - 1) {
      Navigator.pushReplacementNamed(context, '/login');
    } else {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthLayout(
      showBrand: false,
      scrollable: false,
      child: Column(
        children: [
          Row(
            children: [
              const LunasBrand(showSubtitle: false),
              const Spacer(),
              TextButton(
                onPressed: () =>
                    Navigator.pushReplacementNamed(context, '/login'),
                child: const Text('Skip'),
              ),
            ],
          ),
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              itemCount: _pages.length,
              onPageChanged: (value) => setState(() => _currentPage = value),
              itemBuilder: (context, index) {
                final page = _pages[index];
                return Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 190,
                      height: 190,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEAF3FC),
                        borderRadius: AppRadius.card,
                      ),
                      child: Icon(
                        page.icon,
                        color: AppColorsLight.brandBase,
                        size: 82,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xxxl),
                    Text(
                      page.title,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineLarge
                          ?.copyWith(fontSize: 28, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Text(
                      page.description,
                      textAlign: TextAlign.center,
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(height: 1.6),
                    ),
                  ],
                );
              },
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _pages.length,
              (index) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: index == _currentPage ? 26 : 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: index == _currentPage
                      ? AppColorsLight.brandBase
                      : AppColorsLight.divider,
                  borderRadius: BorderRadius.circular(AppRadius.pill),
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.xl),
          LunasButton(
            label: _currentPage == _pages.length - 1
                ? 'Get Started'
                : 'Continue',
            onPressed: _continue,
            icon: Icons.arrow_forward_rounded,
          ),
        ],
      ),
    );
  }
}
