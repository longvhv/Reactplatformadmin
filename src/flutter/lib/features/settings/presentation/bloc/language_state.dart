import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'language_state.freezed.dart';

@freezed
class LanguageState with _$LanguageState {
  const factory LanguageState.initial() = LanguageInitial;
  const factory LanguageState.loaded(Locale locale) = LanguageLoaded;
}
