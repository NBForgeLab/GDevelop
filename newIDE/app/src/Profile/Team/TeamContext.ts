import * as React from 'react';
import {
  type Team,
  type TeamGroup,
  type User,
  type TeamMembership,
  type TeamInvitation,
  type EditUserChanges,
} from '../../Utils/GDevelopServices/User';
import { type CloudProjectWithUserAccessInfo } from '../../Utils/GDevelopServices/Project';

export type TeamState = {
  team: Team | null | undefined;
  groups: Array<TeamGroup> | null | undefined;
  members: Array<User> | null | undefined;
  admins: Array<User> | null | undefined;
  memberships: Array<TeamMembership> | null | undefined;
  invitations: Array<TeamInvitation> | null | undefined;
  onRefreshInvitations: () => Promise<TeamInvitation[] | undefined>;
  onChangeGroupName: (group: TeamGroup, newName: string) => Promise<void>;
  onChangeUserGroup: (user: User, group: TeamGroup) => Promise<void>;
  onListUserProjects: (
    user: User
  ) => Promise<Array<CloudProjectWithUserAccessInfo>>;
  onDeleteGroup: (group: TeamGroup) => Promise<void>;
  onCreateGroup: (attributes: { name: string }) => Promise<void>;
  onRefreshMembers: () => Promise<void>;
  onRefreshAdmins: () => Promise<void>;
  getAvailableSeats: () => number | null;
  onCreateMembers: (quantity: number) => Promise<void>;
  onActivateMembers: (userIds: string[], activate: boolean) => Promise<void>;
  onSetAdmin: (email: string, activate: boolean) => Promise<void>;
  onSetMember: (email: string, activate: boolean) => Promise<void>;
  onChangeMemberPassword: (
    userId: string,
    newPassword: string
  ) => Promise<void>;
  onEditUser: (editedUserId: string, changes: EditUserChanges) => Promise<void>;
  onUpdateTeam: (attributes: {
    classrooms: {
      hideAskAi: boolean;
    };
  }) => Promise<void>;
};

export const initialTeamState: TeamState = {
  team: null,
  groups: null,
  members: null,
  admins: null,
  memberships: null,
  invitations: null,
  onRefreshInvitations: async () => undefined,
  onChangeGroupName: async () => {},
  onChangeUserGroup: async () => {},
  onListUserProjects: async (): Promise<Array<never>> => [],
  onDeleteGroup: async () => {},
  onCreateGroup: async () => {},
  onRefreshMembers: async () => {},
  getAvailableSeats: (): null => null,
  onCreateMembers: async () => {},
  onActivateMembers: async () => {},
  onRefreshAdmins: async () => {},
  onSetAdmin: async () => {},
  onSetMember: async () => {},
  onChangeMemberPassword: async () => {},
  onEditUser: async () => {},
  onUpdateTeam: async () => {},
};

const TeamContext: React.Context<TeamState> =
  React.createContext<TeamState>(initialTeamState);

export default TeamContext;
