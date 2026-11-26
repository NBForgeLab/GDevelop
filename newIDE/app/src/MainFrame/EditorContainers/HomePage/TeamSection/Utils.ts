import {
  type TeamGroup,
  type TeamMembership,
  type User,
} from '../../../../Utils/GDevelopServices/User';

export type GroupWithMembers = {
  group: TeamGroup;
  members: User[];
};

export const groupMembersByGroupId = ({
  groups,
  members,
  memberships,
}: {
  groups: TeamGroup[] | null | undefined;
  members: User[] | null | undefined;
  memberships: TeamMembership[] | null | undefined;
}):
  | {
      active: {
        [groupId: string]: GroupWithMembers;
      };
      inactive: User[];
    }
  | null
  | undefined => {
  if (!(groups && members && memberships)) return null;
  const sortedMembers = members
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt);
  const membersByGroupId: {
    [groupId: string]: GroupWithMembers;
  } = {
    NONE: { group: { id: 'none', name: 'none' }, members: [] },
  };
  const deactivatedMembers: User[] = [];
  sortedMembers.forEach((member) => {
    const membership = memberships.find(
      (membership) => membership.userId === member.id
    );
    if (!membership) return;
    if (member.deactivatedAt) {
      deactivatedMembers.push(member);
      return;
    }
    const memberGroups = membership.groups;
    if (!memberGroups) {
      const itemWithoutGroup = membersByGroupId['NONE'];
      membersByGroupId['NONE'] = {
        members: [
          ...((itemWithoutGroup && itemWithoutGroup.members) || []),
          member,
        ],
        group: { id: 'none', name: 'none' },
      };
      return;
    }
    const group = groups.find((group) => group.id === memberGroups[0]);
    if (!group) return;
    const item = membersByGroupId[group.id];
    if (item) {
      item.members = [...item.members, member];
    } else {
      membersByGroupId[group.id] = { group, members: [member] };
    }
  });
  groups.forEach((group) => {
    if (!(group.id in membersByGroupId)) {
      membersByGroupId[group.id] = { group, members: [] };
    }
  });
  return { active: membersByGroupId, inactive: deactivatedMembers };
};

export const sortGroupsWithMembers = (groupWithMembersByGroupId: {
  [groupId: string]: GroupWithMembers;
}): GroupWithMembers[] =>
  Object.keys(groupWithMembersByGroupId)
    .map((id) => (id === 'NONE' ? null : groupWithMembersByGroupId[id]))
    .filter((groupWithMembers): groupWithMembers is GroupWithMembers =>
      Boolean(groupWithMembers)
    )
    .sort((a, b) => a.group.name.localeCompare(b.group.name));
