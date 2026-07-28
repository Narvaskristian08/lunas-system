import 'package:flutter/material.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_spacing.dart';
import 'package:lunas_mobile/core/widgets/lunas_app_bar.dart';
import 'package:lunas_mobile/core/widgets/lunas_button.dart';
import 'package:lunas_mobile/core/widgets/lunas_card.dart';

class LocationConfirmationScreen extends StatelessWidget {
  const LocationConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final data =
        ModalRoute.of(context)?.settings.arguments as (String, String)? ??
        ('Rizal Avenue, Barangay 5', '14.5995° N, 120.9842° E');
    return Scaffold(
      appBar: const LunasAppBar(
        title: 'Confirm Location',
        showBackButton: true,
      ),
      body: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Align(
            alignment: Alignment.topCenter,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Spacer(),
                  const Icon(
                    Icons.location_on_rounded,
                    size: 74,
                    color: AppColorsLight.brandBase,
                  ),
                  const SizedBox(height: AppSpacing.xl),
                  Text(
                    'Is this the correct location?',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    'Confirm the pin before adding it to your report.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: AppSpacing.xxl),
                  LunasCard(
                    child: Column(
                      children: [
                        Text(
                          data.$1,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          data.$2,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  LunasButton(
                    label: 'Use This Location',
                    onPressed: () => Navigator.pop(context, true),
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  OutlinedButton(
                    onPressed: () => Navigator.pop(context, false),
                    child: const Text('Adjust Pin'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
