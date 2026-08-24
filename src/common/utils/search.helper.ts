import { Op } from 'sequelize';

export function buildSearchFilter(
  searchTerm?: string,
  fields: string[] = ['name', 'title', 'email'],
): any {
  if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
    return null;
  }

  const term = `%${searchTerm.trim().replace(/[%_]/g, '\\$&')}%`;
  return {
    [Op.or]: fields.map((field) => ({
      [field]: { [Op.iLike]: term },
    })),
  };
}
