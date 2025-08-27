declare module "*.jpg";
declare module "*.png" {
  const content: any;
  export default content;
}
