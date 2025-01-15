import { Badge } from '~/components/admin/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '~/components/admin/ui/card';

interface Tutor {
    name: string;
    subject: string;
    rating: number;
    experience: number;
}

interface Tutor {
    name: string;
    subject: string;
    rating: number;
    experience: number;
}

const TutorDetalle = ({ tutor }: { tutor: Tutor }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{tutor.name}</CardTitle>
                <Badge>{tutor.subject}</Badge>
            </CardHeader>
            <CardContent>
                <p>Rating: {tutor.rating}</p>
                <p>Experience: {tutor.experience} years</p>
            </CardContent>
        </Card>
    );
};

export default TutorDetalle;
