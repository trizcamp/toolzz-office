const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center">
      <h1 className="text-2xl font-semibold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground">Em breve disponível</p>
    </div>
  </div>
);

export default PlaceholderPage;
