"use client";
import { useState, useEffect, useRef } from "react";

// Extend the window interface to include YT
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function Home() {
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=k8BvmGPG0M4");
  const [video_id, setVideoId] = useState("k8BvmGPG0M4");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [notes, setNotes] = useState<{ id: string, timeStamp: string, date: string, videoId: string, note: string }[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const loadYouTubeAPI = () => {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.defer = true;

      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    };

    const onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("player", {
        events: {
          onReady: onPlayerReady,
        },
      });
    };

    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    loadYouTubeAPI();

    function onPlayerReady(event: any) {
      fetchVideoTitle();
      loadNotes();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, []);

  const fetchVideoTitle = () => {
    if (playerRef.current) {
      const videoId = playerRef.current.getVideoData().video_id;
      fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=AIzaSyAIVYSW1n9HRiAo0m3G2bIjivAlzNn7Khc`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.items && data.items.length > 0) {
            setVideoTitle(data.items[0].snippet.title);
            setVideoDescription(data.items[0].snippet.description);
          }
        })
        .catch((error) => {
          console.error("Error fetching video title:", error);
        });
    }
  };

  const loadNotes = () => {
    if (playerRef.current) {
      const videoId = playerRef.current.getVideoData().video_id;
      const storedNotes = localStorage.getItem(`notes_${videoId}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    }
  };

  const handleNoteAdd = () => {
    setIsAddingNote(true);
  };

  const handleSaveNote = () => {
    if (playerRef.current && newNoteText.trim()) {
      const time = playerRef.current.getCurrentTime();
      const today = new Date();
      const formattedDate = `${today.getDate()} ${today.toLocaleString("default", { month: "long" })} ${today.getFullYear()}`;
      const newNote = {
        id: `${Math.random().toString(36)}`,
        timeStamp: `${Math.floor(time / 60)}:${Math.floor(time % 60).toString().padStart(2, '0')}`,
        date: formattedDate,
        videoId: playerRef.current.getVideoData().video_id,
        note: newNoteText,
      };
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);
      localStorage.setItem(`notes_${newNote.videoId}`, JSON.stringify(updatedNotes));
      setNewNoteText("");
      setIsAddingNote(false);
    }
  };

  const handleNoteClick = (timeStamp: string) => {
    const [minutes, seconds] = timeStamp.split(":").map(Number);
    const timeInSeconds = minutes * 60 + seconds;
    if (playerRef.current) {
      playerRef.current.seekTo(timeInSeconds);
    }
  };

  const handleEditNote = (noteId: string) => {
    const noteToEdit = notes.find(note => note.id === noteId);
    if (noteToEdit) {
      setEditingNoteId(noteId);
      setEditingNoteText(noteToEdit.note);
    }
  };

  const handleSaveEditedNote = () => {
    if (editingNoteId !== null) {
      const updatedNotes = notes.map(note =>
        note.id === editingNoteId ? { ...note, note: editingNoteText } : note
      );
      setNotes(updatedNotes);
      localStorage.setItem(`notes_${updatedNotes[0].videoId}`, JSON.stringify(updatedNotes));
      setEditingNoteId(null);
      setEditingNoteText("");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);
    if (updatedNotes.length > 0) {
      localStorage.setItem(`notes_${updatedNotes[0].videoId}`, JSON.stringify(updatedNotes));
    } else {
      localStorage.removeItem(`notes_${video_id}`);
    }
  };

  return (
    <>
      <main className="flex flex-col items-center space-y-8 mb-8">
        <section className="player_section">
          <div className="flex flex-col md:flex-row justify-center mt-10 gap-4">
            <input
              type="text"
              className="p-2 border border-[#101828] rounded-md w-full placeholder:font-light"
              placeholder="Paste youtube video URL here..."
              onChange={(e) => {
                setVideoUrl(e.target.value)
                setVideoId(e.target.value.split("v=")[1])
              }}
            />
          </div>
          <h2 className="py-8 text-3xl font-semibold text-[#101828]">Video player with notes</h2>
          <div className="flex justify-center">
            <iframe
              id="player"
              className="w-[96vw] h-[54vw] sm:w-[80vw] sm:h-[45vw] rounded-lg"
              src={`https://www.youtube.com/embed/${video_id}?enablejsapi=1&autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&fs=0&start=0`}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>

          <div className="space-y-4 mt-8 max-w-[96vw] sm:max-w-[80vw]">
            <p className="text-xl text-[#101828] font-[600]">{videoTitle}</p>
            <p className="text-sm text-[#475467]">{videoDescription}</p>
            <hr />
          </div>
        </section>
        <section className="notes_section">
          <div className="space-y-6 w-[96vw] sm:w-[80vw] self-start border rounded-md p-6">
            <div className="space-y-4">
              <div className="flex justify-between flex-wrap gap-6">
                <div>
                  <p className="text-xl text-[#101828] font-[600]">My notes</p>
                  <p className="text-sm text-[#475467]">All your notes at a single place. Click on any note to go to specific timestamp in the video.</p>
                </div>
                {!isAddingNote && !editingNoteId && (
                  <div>
                    <button onClick={handleNoteAdd} className="border-[1px] border-[#D0D5DD] rounded-md py-2 px-4 flex gap-2 items-center font-[600] text-[#344054]">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 6.66669V13.3334M6.66669 10H13.3334M18.3334 10C18.3334 14.6024 14.6024 18.3334 10 18.3334C5.39765 18.3334 1.66669 14.6024 1.66669 10C1.66669 5.39765 5.39765 1.66669 10 1.66669C14.6024 1.66669 18.3334 5.39765 18.3334 10Z" stroke="#667085" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="">Add new note</p>
                    </button>
                  </div>
                )}
              </div>
              {isAddingNote && (
                <div className="flex justify-between gap-2">
                  <input
                    type="text"
                    className="p-2 border rounded-md w-full placeholder:font-light"
                    placeholder="Type something..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                  />
                  <button onClick={handleSaveNote} className="bg-black rounded-md px-4 py-2 text-white">Save</button>
                </div>
              )}
              {editingNoteId && (
                <div className="flex justify-between gap-2">
                  <input
                    type="text"
                    className="p-2 border rounded-md w-full placeholder:font-light"
                    placeholder="Edit your note..."
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                  />
                  <button onClick={handleSaveEditedNote} className="bg-black rounded-md px-4 py-2 text-white">Save</button>
                </div>
              )}
            </div>
            <hr />
            {notes.map((note) => (
              <div key={note.id} onClick={() => handleNoteClick(note.timeStamp)} className="space-y-4 cursor-pointer">
                <div>
                  <p className="text-[#344054] text-sm font-[500]">{note.date}</p>
                  <p className="text-sm text-[#475467]">Timestamp: <span className="text-[#6941C6] cursor-pointer">{note.timeStamp}</span></p>
                </div>
                <div className="p-3 border rounded-md">
                  <p className="text-sm text-[#344054]">{note.note}</p>
                </div>
                <div className="flex justify-end gap-1">
                  <button onClick={() => handleDeleteNote(note.id)} className="border border-[#D0D5DD] px-[10px] py-[4px] rounded-md text-sm text-[#344054] font-[500]">Delete note</button>
                  <button onClick={() => handleEditNote(note.id)} className="border border-[#D0D5DD] px-[10px] py-[4px] rounded-md text-sm text-[#344054] font-[500]">Edit note</button>
                </div>
                <hr />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
