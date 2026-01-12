import 'package:dartz/dartz.dart';

import '../../../../core/error/failures.dart';
import '../../../../core/usecases/usecase.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class CheckAuthStatusUseCase implements UseCase<User?, NoParams> {
  final AuthRepository _repository;

  CheckAuthStatusUseCase(this._repository);

  @override
  Future<Either<Failure, User?>> call([NoParams? params]) {
    return _repository.checkAuthStatus();
  }
}
