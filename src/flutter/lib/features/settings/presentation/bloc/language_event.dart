import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'language_event.freezed.dart';

@freezed
class LanguageEvent with _$LanguageEvent {
  const factory LanguageEvent.loadLanguage() = LoadLanguage;
  const factory LanguageEvent.changeLanguage(Locale locale) = ChangeLanguage;
}
