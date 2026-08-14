export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface SignupRequest {
  readonly email: string;
  readonly emailConfirmation: string;
}

export interface SetPasswordRequest {
  readonly tokenHash: string;
  readonly password: string;
  readonly passwordConfirmation: string;
}

export interface MemberUser {
  readonly id: string;
  readonly email: string;
}

export interface MemberProfile {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly bio: string;
  readonly grade: number;
  readonly profileCompleted: boolean;
}

export interface UpdateProfileRequest {
  readonly name: string;
  readonly phone: string;
  readonly bio: string;
}

export interface Session {
  readonly accessToken: string;
  readonly user: MemberUser;
  readonly profile: MemberProfile;
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';
