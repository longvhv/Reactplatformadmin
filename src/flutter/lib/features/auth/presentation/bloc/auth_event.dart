import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth_event.freezed.dart';

@freezed
class AuthEvent with _$AuthEvent {
  const factory AuthEvent.checkAuthStatus() = CheckAuthStatus;
  
  const factory AuthEvent.login({
    required String email,
    required String password,
  }) = Login;
  
  const factory AuthEvent.register({
    required String email,
    required String password,
    required String name,
  }) = Register;
  
  const factory AuthEvent.logout() = Logout;
  
  const factory AuthEvent.forgotPassword({
    required String email,
  }) = ForgotPassword;
}
