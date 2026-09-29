import 'package:flutter/foundation.dart';
import 'package:lunas_mobile/core/network/api_exception.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_session.dart';
import 'package:lunas_mobile/features/auth/data/models/auth_user.dart';
import 'package:lunas_mobile/features/auth/data/models/registration_mfa_challenge.dart';
import 'package:lunas_mobile/features/auth/data/services/auth_service.dart';
import 'package:lunas_mobile/features/auth/domain/auth_role_policy.dart';

enum AuthStatus {
  initializing,
  unauthenticated,
  authenticated,
  roleUnavailable,
  restoreFailed,
}

class AuthController extends ChangeNotifier {
  AuthController(this._authService);

  final AuthService _authService;
  AuthStatus _status = AuthStatus.initializing;
  AuthUser? _user;
  String? _message;
  bool _isSubmitting = false;
  RegistrationMfaChallenge? _pendingRegistration;

  AuthStatus get status => _status;
  AuthUser? get user => _user;
  String? get message => _message;
  bool get isSubmitting => _isSubmitting;
  RegistrationMfaChallenge? get pendingRegistration => _pendingRegistration;
  bool get isCitizen => _user?.isCitizen == true;
  bool get isRepairPersonnel =>
      _user != null && isRepairPersonnelRole(_user!.role);
  String? get workspaceHomePath =>
      _user == null ? null : mobileWorkspaceHome(_user!.role);

  Future<void> restoreSession() async {
    _status = AuthStatus.initializing;
    _message = null;
    notifyListeners();
    try {
      if (!await _authService.hasStoredSession()) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }
      _user = await _authService.getCurrentUser();
      _status = _user!.hasSupportedMobileWorkspace
          ? AuthStatus.authenticated
          : AuthStatus.roleUnavailable;
    } on ApiException catch (error) {
      if (error.isUnauthorized) {
        await _authService.clearSession();
        _status = AuthStatus.unauthenticated;
        _message = error.message.toLowerCase().contains('deactivated')
            ? 'Your account has been deactivated. Contact the LUNAS administrator for help.'
            : 'Your session has expired. Please sign in again.';
      } else {
        _status = AuthStatus.restoreFailed;
        _message = error.message;
      }
    } catch (_) {
      _status = AuthStatus.restoreFailed;
      _message = 'We could not restore your session. Please try again.';
    }
    notifyListeners();
  }

  Future<bool> login({required String email, required String password}) {
    return _completeAuthentication(
      () => _authService.login(email: email, password: password),
    );
  }

  Future<RegistrationMfaChallenge?> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    _isSubmitting = true;
    _message = null;
    notifyListeners();
    try {
      _pendingRegistration = await _authService.register(
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        password: password,
      );
      return _pendingRegistration;
    } on ApiException catch (error) {
      _message = error.message;
      return null;
    } on FormatException catch (error) {
      _message = error.message;
      return null;
    } catch (_) {
      _message =
          'We could not start registration verification. Please try again.';
      return null;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> verifyRegistrationMfa(String code) async {
    final challenge = _pendingRegistration;
    if (challenge == null) {
      _message = 'Start registration again to request a new verification code.';
      notifyListeners();
      return false;
    }
    final success = await _completeAuthentication(
      () =>
          _authService.verifyRegistrationMfa(challenge: challenge, code: code),
    );
    if (success) _pendingRegistration = null;
    return success;
  }

  Future<bool> resendRegistrationMfa() async {
    final challenge = _pendingRegistration;
    if (challenge == null) return false;
    _isSubmitting = true;
    _message = null;
    notifyListeners();
    try {
      _pendingRegistration = await _authService.resendRegistrationMfa(
        challenge,
      );
      return true;
    } on ApiException catch (error) {
      _message = error.message;
      return false;
    } catch (_) {
      _message = 'We could not resend the verification code. Please try again.';
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> resetPassword({
    required String token,
    required String password,
  }) {
    return _completeAuthentication(
      () => _authService.resetPassword(token: token, password: password),
    );
  }

  Future<bool> _completeAuthentication(
    Future<AuthSession> Function() action,
  ) async {
    _isSubmitting = true;
    _message = null;
    notifyListeners();
    try {
      final session = await action();
      await _authService.persist(session);
      _user = session.user;
      _status = _user!.hasSupportedMobileWorkspace
          ? AuthStatus.authenticated
          : AuthStatus.roleUnavailable;
      return true;
    } on ApiException catch (error) {
      _message = error.message;
      return false;
    } on FormatException catch (error) {
      _message = error.message;
      return false;
    } catch (_) {
      _message = 'We could not complete that request. Please try again.';
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile({
    required String firstName,
    required String lastName,
    required String phone,
    String? address,
  }) async {
    _isSubmitting = true;
    _message = null;
    notifyListeners();
    try {
      _user = await _authService.updateProfile(
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        address: address,
      );
      return true;
    } on ApiException catch (error) {
      _message = error.message;
      return false;
    } catch (_) {
      _message = 'We could not update your profile. Please try again.';
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isSubmitting = true;
    notifyListeners();
    try {
      await _authService.logout();
    } finally {
      _user = null;
      _pendingRegistration = null;
      _status = AuthStatus.unauthenticated;
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<void> expireSession() async {
    await _authService.clearSession();
    _user = null;
    _pendingRegistration = null;
    _status = AuthStatus.unauthenticated;
    _message = 'Your session has expired. Please sign in again.';
    notifyListeners();
  }

  void clearMessage() {
    if (_message == null) return;
    _message = null;
    notifyListeners();
  }
}
