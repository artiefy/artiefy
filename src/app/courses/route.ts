import { type NextApiRequest, type NextApiResponse } from 'next';
import { getAllCourses } from '~/server/actions/studentActions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { page = 1, limit = 10, search = '', category } = req.query;

    try {
      const { courses, totalPages, totalCourses } = await getAllCourses({
        pagenum: Number(page) - 1,
        categoryId: category ? Number(category) : undefined,
        searchTerm: String(search),
      });
      res.status(200).json({ courses, totalPages, totalCourses });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching courses', error });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}