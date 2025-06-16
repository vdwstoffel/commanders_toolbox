export default function ErrorMessage({ msg }: { msg: string }) {
  return (
    <div className="mx-auto w-fit mt-10">
      <h1 className="text-center mx-auto py-1/2 text-red-500 font-bold text-xl">{msg}</h1>
    </div>
  );
}
