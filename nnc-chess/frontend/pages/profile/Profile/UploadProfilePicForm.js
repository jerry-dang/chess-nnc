import { useRef, useState, useEffect } from "react";
import { deleteImage, addImage, hasProfilePic } from '../../../src/api/api.mjs'

export default function UploadProfilePicForm({ visible, setVisible, triggerRender }) {
    const imagePath = useRef(null);
    const [errorMessage, setErrorMessage] = useState('Upload an image');
    const [showDeleteButton, setShowDeleteButton] = useState(false);

    useEffect(() => {
        hasProfilePic().then(has => setShowDeleteButton(has));
    }, [visible, showDeleteButton, triggerRender]);

    const handleProfilePicUpload = (e) => {
        e.preventDefault(); // Prevents the default form submission behavior
        addImage(imagePath.current.files[0])
        .then(
            async res => {
                if (res.status !== 201) {
                    const result = await res.json();
                    console.log(result);
                    setErrorMessage(result.error);
                }
                else {
                    imagePath.current.value = null;
                    setErrorMessage('');
                    setVisible(!visible);
                }
            }
        );
    };

    return (
        <div>
            <button className="submit-button" onClick={() => setVisible(!visible)}>Change profile picture</button>
            <button className={`delete-button ${showDeleteButton ? '' : 'hidden'}`} onClick={() => {deleteImage(); triggerRender();}}>Delete profile picture</button>
            <div className={`popup ${visible ? '' : 'hidden'}`}>
                <form className="popup-content" id="add_image_form">
                    <span className="close" id="close-popup" onClick={() => setVisible(!visible)}>&times;</span>
                    <input
                        type="file"
                        id="file_upload"
                        className="form_element"
                        placeholder="Upload an image"
                        name="picture"
                        accept="image/*"
                        required
                        ref={imagePath}
                    />
                    <button className="submit-button" onClick={handleProfilePicUpload}>Upload</button>
                    <p className="error-prompt" id="error-add-image">{errorMessage}</p>
                </form>
            </div>
        </div>
  );
}