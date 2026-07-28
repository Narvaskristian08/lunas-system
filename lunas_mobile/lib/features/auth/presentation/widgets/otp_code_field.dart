import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lunas_mobile/core/theme/app_colors.dart';
import 'package:lunas_mobile/core/theme/app_radius.dart';

class OtpCodeField extends StatelessWidget {
  const OtpCodeField({
    required this.controllers,
    required this.focusNodes,
    this.onCompleted,
    super.key,
  }) : assert(controllers.length == 6),
       assert(focusNodes.length == 6);

  final List<TextEditingController> controllers;
  final List<FocusNode> focusNodes;
  final VoidCallback? onCompleted;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(6, (index) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: index == 5 ? 0 : 7),
            child: TextField(
              controller: controllers[index],
              focusNode: focusNodes[index],
              autofocus: index == 0,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              textInputAction: index == 5
                  ? TextInputAction.done
                  : TextInputAction.next,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(1),
              ],
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: AppRadius.input,
                  borderSide: const BorderSide(color: AppColorsLight.divider),
                ),
              ),
              onChanged: (value) {
                if (value.isNotEmpty && index < 5) {
                  focusNodes[index + 1].requestFocus();
                } else if (value.isEmpty && index > 0) {
                  focusNodes[index - 1].requestFocus();
                }
                if (controllers.every((item) => item.text.isNotEmpty)) {
                  onCompleted?.call();
                }
              },
            ),
          ),
        );
      }),
    );
  }
}
