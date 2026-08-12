const fs = require('fs');
const code = fs.readFileSync('src/lib/firebase.ts', 'utf8');
const toAdd = `
import { query, where, WhereFilterOp } from 'firebase/firestore';

export const subscribeToCollectionWhere = <T = any>(
  collectionName: string,
  field: string,
  opStr: WhereFilterOp,
  value: any,
  callback: (items: T[]) => void
) => {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    callback([]);
    return () => {};
  }
  const colRef = collection(db, collectionName);
  const q = query(colRef, where(field, opStr, value));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: T[] = [];
      snapshot.forEach((docSnapshot) => {
        list.push({ id: docSnapshot.id, ...docSnapshot.data() } as unknown as T);
      });
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, collectionName);
    }
  );
};
`;
// just append for now, but wait, `import { query, where } from 'firebase/firestore'` might already exist
