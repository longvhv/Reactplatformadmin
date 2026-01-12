import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:injectable/injectable.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'language_event.dart';
import 'language_state.dart';

@injectable
class LanguageBloc extends Bloc<LanguageEvent, LanguageState> {
  final SharedPreferences _prefs;
  static const String _languageKey = 'language_code';

  LanguageBloc(this._prefs) : super(const LanguageState.initial()) {
    on<LoadLanguage>(_onLoadLanguage);
    on<ChangeLanguage>(_onChangeLanguage);
  }

  Future<void> _onLoadLanguage(
    LoadLanguage event,
    Emitter<LanguageState> emit,
  ) async {
    final languageCode = _prefs.getString(_languageKey) ?? 'vi';
    emit(LanguageState.loaded(Locale(languageCode)));
  }

  Future<void> _onChangeLanguage(
    ChangeLanguage event,
    Emitter<LanguageState> emit,
  ) async {
    await _prefs.setString(_languageKey, event.locale.languageCode);
    emit(LanguageState.loaded(event.locale));
  }
}
