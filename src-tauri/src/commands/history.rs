use crate::actions::process_transcription_output;
use crate::managers::{
    history::{HistoryManager, PaginatedHistory},
    transcription::TranscriptionManager,
};
use std::sync::Arc;
use tauri::{AppHandle, State};

#[tauri::command]
#[specta::specta]
pub async fn get_history_entries(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    cursor: Option<i64>,
    limit: Option<usize>,
) -> Result<PaginatedHistory, String> {
    history_manager
        .get_history_entries(cursor, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn toggle_history_entry_saved(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    id: i64,
) -> Result<(), String> {
    history_manager
        .toggle_saved_status(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_audio_file_path(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    file_name: String,
) -> Result<String, String> {
    // The name comes from the webview. Only a bare file name inside the
    // recordings directory is acceptable; a path with separators or `..`
    // would resolve (and be served via the asset protocol) anywhere on disk.
    if !HistoryManager::is_safe_recording_file_name(&file_name) {
        return Err("Invalid recording file name".to_string());
    }
    let path = history_manager.get_audio_file_path(&file_name);
    path.to_str()
        .ok_or_else(|| "Invalid file path".to_string())
        .map(|s| s.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_history_entry(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    id: i64,
) -> Result<(), String> {
    history_manager
        .delete_entry(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn retry_history_entry_transcription(
    app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    transcription_manager: State<'_, Arc<TranscriptionManager>>,
    id: i64,
) -> Result<(), String> {
    let entry = history_manager
        .get_entry_by_id(id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("History entry {} not found", id))?;

    let audio_path = history_manager.get_audio_file_path(&entry.file_name);
    // WAV decode is file I/O; keep it off the async workers like the
    // transcription below.
    let samples = tauri::async_runtime::spawn_blocking(move || {
        crate::audio_toolkit::read_wav_samples(&audio_path)
    })
    .await
    .map_err(|e| format!("Audio load task panicked: {}", e))?
    .map_err(|e| format!("Failed to load audio: {}", e))?;

    if samples.is_empty() {
        return Err("Recording has no audio samples".to_string());
    }

    transcription_manager.initiate_model_load();

    let tm = Arc::clone(&transcription_manager);
    let transcription = tauri::async_runtime::spawn_blocking(move || tm.transcribe(samples))
        .await
        .map_err(|e| format!("Transcription task panicked: {}", e))?
        .map_err(|e| e.to_string())?;

    if transcription.is_empty() {
        return Err("Recording contains no speech".to_string());
    }

    let processed =
        process_transcription_output(&app, &transcription, entry.post_process_requested).await;
    let hm = Arc::clone(&history_manager);
    tauri::async_runtime::spawn_blocking(move || {
        hm.update_transcription(
            id,
            transcription,
            processed.post_processed_text,
            processed.post_process_prompt,
        )
    })
    .await
    .map_err(|e| format!("History update task panicked: {}", e))?
    .map(|_| ())
    .map_err(|e| e.to_string())
}

/// Prunes history on the blocking pool: lowering the limit from hundreds to a
/// few deletes hundreds of rows and WAV files, which must not stall other
/// commands on a tokio worker.
async fn cleanup_old_entries_blocking(history_manager: &Arc<HistoryManager>) -> Result<(), String> {
    let hm = Arc::clone(history_manager);
    tauri::async_runtime::spawn_blocking(move || hm.cleanup_old_entries())
        .await
        .map_err(|e| format!("History cleanup task panicked: {}", e))?
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_history_limit(
    app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    limit: usize,
) -> Result<(), String> {
    let mut settings = crate::settings::get_settings(&app);
    settings.history_limit = limit;
    crate::settings::write_settings(&app, settings);

    cleanup_old_entries_blocking(&history_manager).await
}

#[tauri::command]
#[specta::specta]
pub async fn update_recording_retention_period(
    app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    period: crate::settings::RecordingRetentionPeriod,
) -> Result<(), String> {
    // The enum deserializes itself; a hand-written name table here drifted
    // from the serde names as variants were added.
    let mut settings = crate::settings::get_settings(&app);
    settings.recording_retention_period = period;
    crate::settings::write_settings(&app, settings);

    cleanup_old_entries_blocking(&history_manager).await
}
