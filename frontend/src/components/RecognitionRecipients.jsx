import React from 'react';
export default function RecognitionRecipients({ recognition, onOpenProfile }) {
  const receivers = recognition.receivers?.length ? recognition.receivers : [{ id: recognition.receiver_id, name: recognition.receiver_name }];
  return receivers.map((receiver, index) => (
    <React.Fragment key={receiver.id}>
      {index > 0 ? (index === receivers.length - 1 ? ' y ' : ', ') : null}
      <button type="button" className="inline-user-link" onClick={() => onOpenProfile?.(receiver.id)}>{receiver.name}</button>
    </React.Fragment>
  ));
}
