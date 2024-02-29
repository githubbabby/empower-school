import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuid } from "uuid";
import { getAuth } from "firebase/auth";

export async function storeImage(ubicacion, imagen) {
  return new Promise((resolve, reject) => {
    const auth = getAuth();
    const storage = getStorage();
    const filename = `${auth.currentUser.uid}-${imagen.name}-${uuid()}`;
    const storageRef = ref(storage, `${ubicacion}/${filename}`);
    const uploadTask = uploadBytesResumable(storageRef, imagen);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload is ${progress}% done`);
      },
      (error) => {
        reject(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          resolve(downloadURL);
        });
      }
    );
  });
}
