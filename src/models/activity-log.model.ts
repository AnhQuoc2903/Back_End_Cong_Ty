import { Schema, model, Types, Document } from "mongoose";

export interface IActivityLog extends Document {
  actor?: Types.ObjectId;
  actorSnapshot?: {
    _id?: Types.ObjectId;
    email?: string;
    fullName?: string;
  };

  action: string;
  details?: string;
  targetType: string;
  targetId?: Types.ObjectId;

  targetSnapshot?: {
    _id?: Types.ObjectId;
    email?: String;
    fullName?: String;
  };

  before?: any;
  after?: any;

  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    actorSnapshot: {
      _id: { type: Schema.Types.ObjectId },
      email: { type: String },
      fullName: { type: String },
    },

    action: { type: String, required: true },
    details: { type: String },
    targetType: { type: String, required: true },

    targetId: {
      type: Schema.Types.ObjectId,
    },

    targetSnapshot: {
      _id: Schema.Types.ObjectId,
      email: String,
      fullName: String,
    },

    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,

    ip: String,
    userAgent: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ActivityLog = model<IActivityLog>(
  "ActivityLog",
  activityLogSchema
);
