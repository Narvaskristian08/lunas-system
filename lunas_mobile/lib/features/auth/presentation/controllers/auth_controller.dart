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
  Map<String, String> _profileFieldErrors = const {};
  bool _isSubmitting = false;
  bool _registrationCompleted = false;
  RegistrationMfaChallenge? _pendingRegistration;

  AuthStatus get status => _status;
  AuthUser? get user => _user;
  String? get message => _message;
  Map<String, String> get profileFieldErrors => _profileFieldErrors;
  bool get isSubmitting => _isSubmitting;
  bool get registrationCompleted => _registrationCompleted;
  RegistrationMfaChallenge? get pendingRegistration => _pendingRegistration;
  bool get isCitizen => _user?.isCitizen == true;
  bool get isTanod => _user != null && isTanodRole(_user!.role);
  bool get isRepairPersonnel =>
      _user != null && isRepairPersonnelRole(_user!.role);
  String? get workspaceHomePath =>
      _user == null ? null : mobileWorkspaceHome(_user!.role);

  Future<void> restoreSession() async {
    _status = AuthStatus.initializing;
    _message = null;
    notifyListeners();
    try {
      _pendingRegistration = await _authService.restorePendingRegistration();
      if (!await _authService.hasStoredSession()) {
        _status = AuthStatus.unauthenticated;
        notifyListeners();
        return;
      }
      _user = await _authService.getCurrentUser();
      if (!_user!.hasSupportedMobileWorkspace) {
        await _rejectUnsupportedAccount();
      } else {
        _status = AuthStatus.authenticated;
      }
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

  Future<bool> refreshProfile() async {
    final currentId = _user?.id;
    if (currentId == null) return false;
    try {
      final updated = await _authService.getCurrentUser();
      if (_user?.id != currentId || _status != AuthStatus.authenticated) {
        return false;
      }
      _user = updated;
      notifyListeners();
      return true;
    } on ApiException catch (error) {
      if (error.isUnauthorized && _user?.id == currentId) {
        await logout();
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) => _completeAuthentication(
    () => _authService.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    ),
  );

  Future<bool> login({required String email, required String password}) {
    return _completeAuthentication(
      () => _authService.login(email: email, password: password),
    );
  }

  Future<RegistrationMfaChallenge?> register({
    required String firstName,
    String? middleName,
    bool noMiddleName = false,
    String? suffix,
    required String lastName,
    required String email,
    String? phone,
    required String password,
  }) async {
    _isSubmitting = true;
    _message = null;
    _registrationCompleted = false;
    notifyListeners();
    try {
      _pendingRegistration = await _authService.register(
        firstName: firstName,
        middleName: middleName,
        noMiddleName: noMiddleName,
        suffix: suffix,
        lastName: lastName,
        email: email,
        phone: phone,
        password: password,
      );
      await _authService.savePendingRegistration(_pendingRegistration!);
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
    _isSubmitting = true;
    _message = null;
    _registrationCompleted = false;
    notifyListeners();
    try {
      // Registration verification returns a token for API compatibility, but
      // a new citizen must still sign in explicitly before receiving a mobile
      // session. This keeps account creation separate from authentication.
      await _authService.verifyRegistrationMfa(
        challenge: challenge,
        code: code,
      );
      await _authService.clearSession();
      _pendingRegistration = null;
      await _authService.clearPendingRegistration();
      _user = null;
      _status = AuthStatus.unauthenticated;
      _registrationCompleted = true;
      _message = 'Account created successfully. Please log in to continue.';
      return true;
    } on ApiException catch (error) {
      _message = error.message;
      return false;
    } on FormatException catch (error) {
      _message = error.message;
      return false;
    } catch (_) {
      _message = 'We could not verify your account. Please try again.';
      return false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
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
      await _authService.savePendingRegistration(_pendingRegistration!);
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
    _registrationCompleted = false;
    notifyListeners();
    try {
      final session = await action();
      if (!session.user.hasSupportedMobileWorkspace) {
        await _rejectUnsupportedAccount();
        return false;
      }
      await _authService.persist(session);
      await _authService.clearPendingRegistration();
      _pendingRegistration = null;
      _user = session.user;
      _status = AuthStatus.authenticated;
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

  Future<void> _rejectUnsupportedAccount() async {
    await _authService.clearSession();
    _user = null;
    _pendingRegistration = null;
    _status = AuthStatus.unauthenticated;
    _message =
        'Mobile sign-in is available only for citizen and utility personnel accounts. Please use the LUNAS web portal for your account.';
  }

  Future<bool> updateProfile({
    required String firstName,
    required String lastName,
    required String phone,
    String? middleName,
    String? suffix,
    bool? noMiddleName,
    String? address,
  }) async {
    _isSubmitting = true;
    _message = null;
    _profileFieldErrors = const {};
    notifyListeners();
    try {
      _user = await _authService.updateProfile(
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        middleName: middleName,
        suffix: suffix,
        noMiddleName: noMiddleName,
        currentAddress: _user?.address,
        address: address,
      );
      _profileFieldErrors = const {};
      return true;
    } on ApiException catch (error) {
      _message = error.message;
      _profileFieldErrors = error.fieldErrors;
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
      _registrationCompleted = false;
      _status = AuthStatus.unauthenticated;
      _isSubmitting = false;
      notifyListeners();
    }
  }

  Future<void> expireSession() async {
    await _authService.clearSession();
    _user = null;
    _pendingRegistration = null;
    _registrationCompleted = false;
    _status = AuthStatus.unauthenticated;
    _message = 'Your session has expired. Please sign in again.';
    notifyListeners();
  }

  void clearMessage() {
    if (_message == null && !_registrationCompleted) return;
    _message = null;
    _registrationCompleted = false;
    notifyListeners();
  }
}
