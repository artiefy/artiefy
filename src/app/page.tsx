const mockUrls = [
  "https://utfs.io/f/cuMzG0ZrGHoQcFlCmDtZrGHoQTPaB096RdklNDhJeIS851AZ",
  "https://utfs.io/f/cuMzG0ZrGHoQEFnc2ndsRnABDXmVQqNY8uaKg3CWo2d1vtfb",
  "https://utfs.io/f/cuMzG0ZrGHoQcoKxC6ZrGHoQTPaB096RdklNDhJeIS851AZ4",
  "https://utfs.io/f/cuMzG0ZrGHoQtbOhSdc0QHXWJg9qdZOD6CN3bPiLB1RUrKey",
];

const mockImages = mockUrls.map((url, index) => ({
  id: index + 1,
  url,
}));

export default function HomePage() {
  return (
    <main className="">
      <div className="flex flex-wrap gap-4">
        {[...mockImages, ...mockImages, ...mockImages].map((image, index) => (
          <div key={`${image.id}-${index}`} className="w-48">
            <img src={image.url} alt="image" />
          </div>
        ))}
      </div>
    </main>
  );
}
