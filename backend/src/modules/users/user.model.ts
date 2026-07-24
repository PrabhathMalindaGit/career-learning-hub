import bcrypt from "bcrypt";
import {
  Schema,
  model,
  type HydratedDocument,
  type Model,
} from "mongoose";
import { env } from "../../config/env.js";

export type AccountStatus = "active" | "suspended" | "deleted";
export type UserRole = "user" | "admin";

export interface User {
  email: string;
  passwordHash: string;
  profile: {
    displayName: string;
    headline?: string;
    timezone?: string;
    locale?: string;
  };
  roles: UserRole[];
  accountStatus: AccountStatus;
  emailVerifiedAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): {
    id: string;
    email: string;
    profile: User["profile"];
    roles: UserRole[];
    accountStatus: AccountStatus;
    emailVerifiedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export type UserDocument = HydratedDocument<User, UserMethods>;
type UserModel = Model<User, Record<string, never>, UserMethods>;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const userSchema = new Schema<User, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      set: normalizeEmail,
      maxlength: 320,
    },
    passwordHash: {
      type: String,
      required: true,
      minlength: 12,
      select: false,
    },
    profile: {
      displayName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100,
      },
      headline: {
        type: String,
        trim: true,
        maxlength: 160,
      },
      timezone: {
        type: String,
        trim: true,
        maxlength: 100,
      },
      locale: {
        type: String,
        trim: true,
        maxlength: 20,
      },
    },
    roles: {
      type: [String],
      enum: ["user", "admin"],
      default: ["user"],
    },
    accountStatus: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    emailVerifiedAt: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

userSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "users_email_unique_ci",
    collation: { locale: "en", strength: 2 },
  },
);
userSchema.index({ accountStatus: 1, createdAt: -1 });

userSchema.pre("validate", function normalizeEmailBeforeValidation() {
  if (this.email) this.email = normalizeEmail(this.email);
});

userSchema.pre("save", async function hashPasswordBeforeSave() {
  if (!this.isModified("passwordHash")) return;

  this.passwordHash = await bcrypt.hash(
    this.passwordHash,
    env.BCRYPT_ROUNDS,
  );
});

userSchema.methods.comparePassword = async function comparePassword(
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    email: this.email,
    profile: this.profile,
    roles: this.roles,
    accountStatus: this.accountStatus,
    emailVerifiedAt: this.emailVerifiedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const UserModel = model<User, UserModel>("User", userSchema);
