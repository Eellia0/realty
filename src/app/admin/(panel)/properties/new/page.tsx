import { PropertyForm } from "@/components/admin/PropertyForm";

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-extrabold">Новый объект</h1>
      <PropertyForm
        initial={{
          title: "", description: "", dealType: "SALE", propertyType: "APARTMENT", status: "PUBLISHED",
          price: null, area: null, plotArea: null, bedrooms: null, bathrooms: null, floor: null, floorsTotal: null,
          yearBuilt: null, completion: "READY", completionDate: "", finishing: "", furnishing: "", titleDeed: "",
          seaDistance: null, seaView: false, features: [], region: "GIRNE", district: "", address: "",
          lat: null, lng: null, images: [],
        }}
      />
    </div>
  );
}
