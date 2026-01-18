import { customAlphabet } from 'nanoid';

// Alphabet without ambiguous characters (0, O, I, l, 1)
const nanoid = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',
  8
);

const tokenAlphabet = customAlphabet(
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789',
  32
);

export const generateClassId = () => nanoid();

export const generateMemberId = () => `mbr_${nanoid()}`;

export const generateGroupId = () => `grp_${nanoid()}`;

export const generateGroupMemberId = () => `gm_${nanoid()}`;

export const generateAdminToken = () => tokenAlphabet();
