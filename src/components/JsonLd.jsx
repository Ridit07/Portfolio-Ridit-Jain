export default function JsonLd() {
    const data = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Ridit Jain",
      jobTitle: "Backend Engineer",
      email: "mailto:riditjain07@gmail.com",
      url: "https://your-domain.com",
      sameAs: [
        "https://github.com/Ridit07",
        "https://www.linkedin.com/in/ridit-jain-479230214/"
      ]
    };
    return (
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    );
  }
  