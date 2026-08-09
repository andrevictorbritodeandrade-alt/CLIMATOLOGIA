import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  doc, 
  addDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  onSnapshot,
  getDocFromServer
} from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";
import { FavoriteCity } from "./types";

const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

// Diagnostic Error Handler as required by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: Record<string, any>;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
}

// Connection test for cloud boot validation
export async function testCloudConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("🔥 Conexão com Firebase Cloud estabelecida com sucesso!");
    return true;
  } catch (error) {
    console.warn("Modo de cache local / offline do Firebase ativo.");
    return false;
  }
}

// Helper to generate a consistent document ID for a favorite city
const getFavoriteDocId = (city: FavoriteCity) => {
  const sanitizedName = city.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const lat = city.latitude.toFixed(4).replace(".", "_");
  const lon = city.longitude.toFixed(4).replace(".", "_");
  return `${sanitizedName}_${lat}_${lon}`;
};

// --- REAL-TIME FAVORITES LISTENER ---
export const subscribeFavoritesFromCloud = (onUpdate: (cities: FavoriteCity[]) => void) => {
  const path = "favorites";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: FavoriteCity[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          name: data.name,
          latitude: data.latitude,
          longitude: data.longitude,
          state: data.state || "",
          country: data.country || "",
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

// Add favorite to Cloud
export const addFavoriteToCloud = async (city: FavoriteCity) => {
  const path = `favorites/${getFavoriteDocId(city)}`;
  try {
    const docId = getFavoriteDocId(city);
    await setDoc(doc(db, "favorites", docId), {
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      state: city.state || "",
      country: city.country || "",
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// Remove favorite from Cloud
export const removeFavoriteFromCloud = async (city: FavoriteCity) => {
  const path = `favorites/${getFavoriteDocId(city)}`;
  try {
    const docId = getFavoriteDocId(city);
    await deleteDoc(doc(db, "favorites", docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- REAL-TIME SMS REGISTRATIONS LISTENER ---
export const subscribeSmsRegistrationsFromCloud = (
  onUpdate: (registrations: { id: string; zipcode: string; createdAt?: any }[]) => void
) => {
  const path = "sms_registrations";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: { id: string; zipcode: string; createdAt?: any }[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          zipcode: data.zipcode,
          createdAt: data.createdAt,
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const addSmsRegistrationToCloud = async (zipcode: string) => {
  const path = "sms_registrations";
  try {
    await addDoc(collection(db, path), {
      zipcode,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const removeSmsRegistrationFromCloud = async (id: string) => {
  const path = `sms_registrations/${id}`;
  try {
    await deleteDoc(doc(db, "sms_registrations", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- REAL-TIME SETTINGS & USER PREFERENCES LISTENER ---
export const subscribeSettingsFromCloud = (
  onUpdate: (settings: { isDark?: boolean; activeLocation?: FavoriteCity }) => void
) => {
  const path = "settings/user_preferences";
  return onSnapshot(
    doc(db, "settings", "user_preferences"),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          isDark: data.isDark,
          activeLocation: data.activeLocation,
        });
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const saveSettingsToCloud = async (settings: { isDark?: boolean; activeLocation?: FavoriteCity }) => {
  const path = "settings/user_preferences";
  try {
    await setDoc(
      doc(db, "settings", "user_preferences"),
      {
        ...settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- REAL-TIME WEATHER OBSERVATIONS & CIVIL DEFENSE NOTES ---
export interface WeatherNote {
  id: string;
  title: string;
  content: string;
  locationName: string;
  createdAt?: any;
}

export const subscribeWeatherNotesFromCloud = (onUpdate: (notes: WeatherNote[]) => void) => {
  const path = "weather_notes";
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const list: WeatherNote[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          title: data.title,
          content: data.content,
          locationName: data.locationName,
          createdAt: data.createdAt,
        });
      });
      onUpdate(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
};

export const addWeatherNoteToCloud = async (note: { title: string; content: string; locationName: string }) => {
  const path = "weather_notes";
  try {
    await addDoc(collection(db, path), {
      ...note,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteWeatherNoteFromCloud = async (id: string) => {
  const path = `weather_notes/${id}`;
  try {
    await deleteDoc(doc(db, "weather_notes", id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

