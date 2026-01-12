import '../../../../core/network/dio_client.dart';
import '../../domain/entities/user.dart';
import '../models/auth_response.dart';

abstract class AuthRemoteDataSource {
  Future<AuthResponse> login({
    required String email,
    required String password,
  });
  
  Future<AuthResponse> register({
    required String email,
    required String password,
    required String name,
  });
  
  Future<User> getCurrentUser();
  
  Future<void> forgotPassword({required String email});
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final DioClient _dioClient;

  AuthRemoteDataSourceImpl(this._dioClient);

  @override
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _dioClient.post(
      '/auth/login',
      data: {
        'email': email,
        'password': password,
      },
    );
    
    return AuthResponse.fromJson(response.data);
  }

  @override
  Future<AuthResponse> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final response = await _dioClient.post(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        'name': name,
      },
    );
    
    return AuthResponse.fromJson(response.data);
  }

  @override
  Future<User> getCurrentUser() async {
    final response = await _dioClient.get('/auth/me');
    return User.fromJson(response.data['data']);
  }

  @override
  Future<void> forgotPassword({required String email}) async {
    await _dioClient.post(
      '/auth/forgot-password',
      data: {'email': email},
    );
  }
}
